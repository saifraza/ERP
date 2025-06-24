import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Vendor creation schema
const vendorSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['supplier', 'contractor', 'service_provider']),
  category: z.string().min(1),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6).max(6),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  alternatePhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  creditLimit: z.number().default(0),
  creditDays: z.number().default(30),
  notes: z.string().optional()
})

// Get all vendors for a company
app.get('/', async (c) => {
  const user = c.get('user')
  const { status, category, search } = c.req.query()
  
  try {
    const where: any = {
      companyId: user.companyId
    }
    
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } }
      ]
    }
    
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            quotations: true,
            purchaseOrders: true,
            invoices: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return c.json({ success: true, vendors })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single vendor
app.get('/:id', async (c) => {
  const user = c.get('user')
  const vendorId = c.req.param('id')
  
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId: user.companyId
      },
      include: {
        evaluations: {
          orderBy: { evaluationDate: 'desc' },
          take: 5
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            quotationNumber: true,
            quotationDate: true,
            totalAmount: true,
            status: true
          }
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            poNumber: true,
            orderDate: true,
            totalAmount: true,
            status: true
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            totalAmount: true,
            paidAmount: true,
            status: true
          }
        }
      }
    })
    
    if (!vendor) {
      return c.json({ success: false, error: 'Vendor not found' }, 404)
    }
    
    // Calculate vendor stats
    const stats = await prisma.$transaction([
      // Total business
      prisma.purchaseOrder.aggregate({
        where: { vendorId, companyId: user.companyId },
        _sum: { totalAmount: true }
      }),
      // Pending payments
      prisma.vendorInvoice.aggregate({
        where: { 
          vendorId, 
          companyId: user.companyId,
          status: { in: ['received', 'verified', 'approved'] }
        },
        _sum: { 
          totalAmount: true,
          paidAmount: true
        }
      }),
      // Average delivery time (mock for now)
      Promise.resolve({ avgDeliveryDays: 7 })
    ])
    
    const vendorStats = {
      totalBusiness: stats[0]._sum.totalAmount || 0,
      pendingPayments: (stats[1]._sum.totalAmount || 0) - (stats[1]._sum.paidAmount || 0),
      avgDeliveryDays: stats[2].avgDeliveryDays
    }
    
    return c.json({ 
      success: true, 
      vendor,
      stats: vendorStats
    })
  } catch (error: any) {
    console.error('Error fetching vendor:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new vendor
app.post('/', async (c) => {
  const user = c.get('user')
  
  try {
    const body = await c.req.json()
    const validated = vendorSchema.parse(body)
    
    // Check if vendor code already exists
    const existing = await prisma.vendor.findFirst({
      where: {
        companyId: user.companyId,
        code: validated.code
      }
    })
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Vendor code already exists' 
      }, 400)
    }
    
    const vendor = await prisma.vendor.create({
      data: {
        ...validated,
        companyId: user.companyId,
        qualificationDate: new Date()
      }
    })
    
    return c.json({ success: true, vendor })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating vendor:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update vendor
app.put('/:id', async (c) => {
  const user = c.get('user')
  const vendorId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    
    // Check if vendor exists and belongs to company
    const existing = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId: user.companyId
      }
    })
    
    if (!existing) {
      return c.json({ success: false, error: 'Vendor not found' }, 404)
    }
    
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: body
    })
    
    return c.json({ success: true, vendor })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Evaluate vendor
app.post('/:id/evaluate', async (c) => {
  const user = c.get('user')
  const vendorId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const { 
      qualityScore, 
      deliveryScore, 
      priceScore, 
      serviceScore, 
      comments,
      recommendation 
    } = body
    
    // Validate scores
    const scores = [qualityScore, deliveryScore, priceScore, serviceScore]
    if (scores.some(score => score < 1 || score > 5)) {
      return c.json({ 
        success: false, 
        error: 'Scores must be between 1 and 5' 
      }, 400)
    }
    
    // Calculate overall score
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    const evaluation = await prisma.vendorEvaluation.create({
      data: {
        vendorId,
        evaluationDate: new Date(),
        qualityScore,
        deliveryScore,
        priceScore,
        serviceScore,
        overallScore,
        evaluatedBy: user.name,
        comments,
        recommendation
      }
    })
    
    // Update vendor rating
    const allEvaluations = await prisma.vendorEvaluation.findMany({
      where: { vendorId },
      select: { overallScore: true }
    })
    
    const avgRating = allEvaluations.reduce((sum, e) => sum + e.overallScore, 0) / allEvaluations.length
    
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { rating: avgRating }
    })
    
    return c.json({ success: true, evaluation })
  } catch (error: any) {
    console.error('Error evaluating vendor:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Import vendors from email/CSV
app.post('/import', async (c) => {
  const user = c.get('user')
  
  try {
    const { vendors } = await c.req.json()
    
    if (!Array.isArray(vendors)) {
      return c.json({ 
        success: false, 
        error: 'Expected array of vendors' 
      }, 400)
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    }
    
    for (const vendorData of vendors) {
      try {
        const validated = vendorSchema.parse(vendorData)
        
        // Check if vendor already exists
        const existing = await prisma.vendor.findFirst({
          where: {
            companyId: user.companyId,
            OR: [
              { code: validated.code },
              { email: validated.email }
            ]
          }
        })
        
        if (existing) {
          results.failed++
          results.errors.push({
            vendor: vendorData.code,
            error: 'Vendor already exists'
          })
          continue
        }
        
        await prisma.vendor.create({
          data: {
            ...validated,
            companyId: user.companyId,
            qualificationDate: new Date()
          }
        })
        
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push({
          vendor: vendorData.code || vendorData.name,
          error: error.message
        })
      }
    }
    
    return c.json({ 
      success: true, 
      results,
      message: `Imported ${results.success} vendors, ${results.failed} failed`
    })
  } catch (error: any) {
    console.error('Error importing vendors:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app