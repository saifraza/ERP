import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { procurementAutomation } from '../services/procurement-automation.js'
import { rfqPDFGenerator } from '../services/rfq-pdf-generator.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Create RFQ schema
const createRFQSchema = z.object({
  requisitionId: z.string().uuid(),
  rfqDate: z.string(),
  submissionDeadline: z.string(),
  deliveryDate: z.string(),
  deliveryTerms: z.string(),
  paymentTerms: z.string(),
  specialInstructions: z.string().optional(),
  validityDays: z.number().default(30),
  vendorIds: z.array(z.string().uuid()).min(1),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number(),
    requiredDate: z.string(),
    specification: z.string().optional()
  }))
})

// Get all RFQs
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { status, from, to } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    console.log('Fetching RFQs for user:', userId, 'company:', companyUser.companyId)
    
    const where: any = {
      companyId: companyUser.companyId
    }
    
    if (status) where.status = status
    
    if (from || to) {
      where.issueDate = {}
      if (from) where.issueDate.gte = new Date(from)
      if (to) where.issueDate.lte = new Date(to)
    }
    
    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        requisition: {
          select: {
            requisitionNo: true,
            division: { select: { name: true } }
          }
        },
        vendors: {
          select: {
            id: true,
            vendorId: true,
            emailSent: true,
            responseReceived: true
          }
        },
        items: true,
        _count: {
          select: { quotations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Found RFQs:', rfqs.length)
    
    return c.json({ success: true, rfqs })
  } catch (error: any) {
    console.error('Error fetching RFQs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new RFQ
app.post('/', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const companyId = companyUser.companyId
    const body = await c.req.json()
    
    // Validate request body
    const validated = createRFQSchema.parse(body)
    
    // Get the requisition
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: validated.requisitionId,
        factory: { companyId },
        status: 'APPROVED'
      },
      include: {
        factory: true,
        items: {
          include: {
            material: true
          }
        }
      }
    })
    
    if (!requisition) {
      return c.json({ error: 'Approved requisition not found' }, 404)
    }
    
    // Generate RFQ number
    const count = await prisma.rFQ.count({
      where: { companyId }
    })
    const rfqNumber = `RFQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`
    
    // Create RFQ with items and vendors
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        requisitionId: validated.requisitionId,
        companyId,
        factoryId: requisition.factoryId,
        issueDate: new Date(validated.rfqDate),
        submissionDeadline: new Date(validated.submissionDeadline),
        expectedDeliveryDate: new Date(validated.deliveryDate),
        deliveryTerms: validated.deliveryTerms,
        paymentTerms: validated.paymentTerms,
        specialInstructions: validated.specialInstructions,
        quotationValidityDays: validated.validityDays,
        status: 'OPEN',
        createdBy: userId,
        items: {
          create: requisition.items.map(item => ({
            materialId: item.materialId,
            itemCode: item.material?.code,
            itemDescription: item.material?.name || 'Item',
            quantity: item.quantity,
            unit: item.material?.uom?.code || 'NOS',
            requiredDate: item.requiredDate,
            specifications: item.specification
          }))
        },
        vendors: {
          create: validated.vendorIds.map(vendorId => ({
            vendorId,
            emailSent: false,
            responseReceived: false
          }))
        }
      },
      include: {
        requisition: {
          select: {
            requisitionNo: true,
            division: { select: { name: true } }
          }
        },
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        items: {
          include: {
            material: {
              select: {
                code: true,
                name: true,
                uom: {
                  select: { code: true }
                }
              }
            }
          }
        }
      }
    })
    
    // Keep requisition status as APPROVED since RFQ is just a quotation request
    // Status will change to ORDERED only when PO is created
    // await prisma.requisition.update({
    //   where: { id: validated.requisitionId },
    //   data: { 
    //     status: 'PARTIALLY_ORDERED',
    //     updatedAt: new Date()
    //   }
    // })
    
    return c.json({ 
      success: true,
      rfq,
      message: `RFQ ${rfqNumber} created successfully`
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, 400)
    }
    console.error('Error creating RFQ:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get single RFQ
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      include: {
        requisition: {
          include: {
            division: true,
            items: true
          }
        },
        vendors: {
          include: {
            vendor: true
          }
        },
        items: true,
        quotations: {
          include: {
            vendor: true,
            items: true
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    return c.json({ success: true, rfq })
  } catch (error: any) {
    console.error('Error fetching RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Send RFQ to vendors
app.post('/:id/send', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId,
        status: 'OPEN'
      }
    })
    
    if (!rfq) {
      return c.json({ 
        success: false, 
        error: 'RFQ not found or already sent' 
      }, 404)
    }
    
    // Send emails to vendors
    const result = await procurementAutomation.sendRFQToVendors(rfqId)
    
    return c.json({
      success: true,
      message: 'RFQ sent to vendors',
      ...result
    })
  } catch (error: any) {
    console.error('Error sending RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Close RFQ
app.post('/:id/close', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId,
        status: 'SENT'
      }
    })
    
    if (!rfq) {
      return c.json({ 
        success: false, 
        error: 'RFQ not found or not in sent status' 
      }, 404)
    }
    
    const updated = await prisma.rFQ.update({
      where: { id: rfqId },
      data: { 
        status: 'CLOSED',
        updatedAt: new Date()
      }
    })
    
    return c.json({ 
      success: true,
      rfq: updated,
      message: 'RFQ closed successfully'
    })
  } catch (error: any) {
    console.error('Error closing RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Compare quotations for an RFQ
app.get('/:id/comparison', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      include: {
        items: true,
        quotations: {
          where: { status: { in: ['received', 'under_review'] } },
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                rating: true
              }
            },
            items: true
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    // Create comparison matrix
    const comparison = rfq.items.map(rfqItem => {
      const itemComparison = {
        itemCode: rfqItem.itemCode,
        itemDescription: rfqItem.itemDescription,
        requiredQuantity: rfqItem.quantity,
        unit: rfqItem.unit,
        vendors: [] as any[]
      }
      
      rfq.quotations.forEach(quotation => {
        const quotationItem = quotation.items.find(
          qi => qi.itemCode === rfqItem.itemCode
        )
        
        if (quotationItem) {
          itemComparison.vendors.push({
            vendorId: quotation.vendor.id,
            vendorName: quotation.vendor.name,
            vendorRating: quotation.vendor.rating,
            unitPrice: quotationItem.unitPrice,
            totalAmount: quotationItem.totalAmount,
            deliveryDays: quotationItem.deliveryDays,
            warranty: quotationItem.warranty
          })
        }
      })
      
      // Sort by unit price
      itemComparison.vendors.sort((a, b) => a.unitPrice - b.unitPrice)
      
      return itemComparison
    })
    
    // Overall comparison
    const overallComparison = rfq.quotations.map(quotation => ({
      vendorId: quotation.vendor.id,
      vendorName: quotation.vendor.name,
      vendorRating: quotation.vendor.rating,
      quotationNumber: quotation.quotationNumber,
      totalAmount: quotation.totalAmount,
      paymentTerms: quotation.paymentTerms,
      deliveryTerms: quotation.deliveryTerms,
      validUntil: quotation.validUntil
    })).sort((a, b) => a.totalAmount - b.totalAmount)
    
    return c.json({ 
      success: true,
      rfq: {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        issueDate: rfq.issueDate,
        submissionDeadline: rfq.submissionDeadline
      },
      itemComparison: comparison,
      overallComparison,
      quotationCount: rfq.quotations.length
    })
  } catch (error: any) {
    console.error('Error comparing quotations:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Select vendor for RFQ items
app.post('/:id/select-vendors', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const { selections } = await c.req.json()
    
    if (!Array.isArray(selections)) {
      return c.json({ 
        success: false, 
        error: 'Selections must be an array' 
      }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    // Create comparison records
    const comparisons = await Promise.all(
      selections.map(async (selection: any) => {
        return await prisma.quotationComparison.create({
          data: {
            rfqId,
            itemCode: selection.itemCode,
            selectedVendorId: selection.vendorId,
            selectionReason: selection.reason,
            comparedBy: userId,
            comparedAt: new Date()
          }
        })
      })
    )
    
    return c.json({ 
      success: true,
      comparisons,
      message: 'Vendor selections recorded'
    })
  } catch (error: any) {
    console.error('Error selecting vendors:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Generate RFQ PDF
app.get('/:id/pdf', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Check if RFQ belongs to user's company
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      select: {
        rfqNumber: true
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    // Generate PDF
    const { buffer, filename } = await rfqPDFGenerator.generateAndSaveRFQ(rfqId)
    
    // Set response headers
    c.header('Content-Type', 'text/plain')
    c.header('Content-Disposition', `attachment; filename="${filename}.txt"`)
    
    // Return PDF buffer
    return c.body(buffer)
  } catch (error: any) {
    console.error('Error generating RFQ PDF:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Generate vendor-specific RFQ PDF
app.get('/:id/pdf/:vendorId', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  const vendorId = c.req.param('vendorId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Check if RFQ belongs to user's company
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      select: {
        rfqNumber: true
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    // Generate vendor-specific PDF
    const buffer = await rfqPDFGenerator.generateVendorRFQPDF(rfqId, vendorId)
    
    const filename = `RFQ_${rfq.rfqNumber}_${vendorId}_${new Date().getTime()}.pdf`
    
    // Set response headers
    c.header('Content-Type', 'text/plain')
    c.header('Content-Disposition', `attachment; filename="${filename}.txt"`)
    
    // Return PDF buffer
    return c.body(buffer)
  } catch (error: any) {
    console.error('Error generating vendor RFQ PDF:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app