import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Vendor creation schema
const vendorSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MATERIAL', 'SERVICE', 'TRANSPORTER', 'CONTRACTOR', 'OTHER']),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6).max(6),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIFSC: z.string().optional(),
  creditLimit: z.number().default(0),
  creditDays: z.number().default(30)
})


// Get all vendors for a company
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { isActive, type, search } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, vendors: [] })
    }
    
    const where: any = {
      companyId: companyId
    }
    
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            invoices: true,
            payments: true
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
  const userId = c.get('userId')
  const vendorId = c.req.param('id')
  
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId
      },
      include: {
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
        where: { vendorId },
        _sum: { totalAmount: true }
      }),
      // Pending payments
      prisma.vendorInvoice.aggregate({
        where: { 
          vendorId,
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
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        success: false, 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    const body = await c.req.json()
    const validated = vendorSchema.parse(body)
    
    // Generate vendor code
    const typePrefix = {
      'MATERIAL': 'MAT',
      'SERVICE': 'SVC',
      'TRANSPORTER': 'TRN',
      'CONTRACTOR': 'CON',
      'OTHER': 'OTH'
    }[validated.type] || 'VEN'
    
    // Get the count of vendors for this company and type
    const vendorCount = await prisma.vendor.count({
      where: {
        companyId: companyId,
        type: validated.type
      }
    })
    
    // Generate code with sequential number
    const paddedNumber = String(vendorCount + 1).padStart(4, '0')
    const vendorCode = `${typePrefix}${paddedNumber}`
    
    const vendor = await prisma.vendor.create({
      data: {
        ...validated,
        code: vendorCode,
        companyId: companyId
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
  const userId = c.get('userId')
  const vendorId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    
    // Check if vendor exists and belongs to company
    const existing = await prisma.vendor.findFirst({
      where: {
        id: vendorId
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


// Import vendors from email/CSV
app.post('/import', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        success: false, 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
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
            companyId: companyId,
            OR: [
              { email: validated.email },
              { name: validated.name }
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
        
        // Generate code for imported vendor
        const importTypePrefix = {
          'MATERIAL': 'MAT',
          'SERVICE': 'SVC',
          'TRANSPORTER': 'TRN',
          'CONTRACTOR': 'CON',
          'OTHER': 'OTH'
        }[validated.type] || 'VEN'
        
        const importVendorCount = await prisma.vendor.count({
          where: {
            companyId: companyId,
            type: validated.type
          }
        })
        
        const importPaddedNumber = String(importVendorCount + 1).padStart(4, '0')
        const importVendorCode = `${importTypePrefix}${importPaddedNumber}`
        
        await prisma.vendor.create({
          data: {
            ...validated,
            code: importVendorCode,
            companyId: companyId
          }
        })
        
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push({
          vendor: vendorData.name || 'Unknown',
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