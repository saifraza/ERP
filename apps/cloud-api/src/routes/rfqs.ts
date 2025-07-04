import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { procurementAutomation } from '../services/procurement-automation.js'
import { rfqPDFFinal } from '../services/rfq-pdf-final.js'
// import { rfqPDFGeneratorV2 } from '../services/rfq-pdf-generator-v2.js' // Removed - using rfq-pdf-final
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes except PDF with token
app.use('*', async (c, next) => {
  // Skip auth middleware for PDF routes with token query param
  const path = c.req.path
  if (path.includes('/pdf') && c.req.query('token')) {
    // Manually verify token for PDF routes
    const token = c.req.query('token')
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    try {
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET!) as any
      c.set('userId', decoded.userId)
      c.set('email', decoded.email)
      return next()
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
  }
  
  // Use normal auth middleware for other routes
  return authMiddleware(c, next)
})

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
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                code: true,
                email: true,
                contactPerson: true
              }
            }
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
    
    // Debug: Log email log counts for each RFQ
    console.log('Checking email logs for RFQs...')
    try {
      const totalEmailLogs = await prisma.rFQEmailLog.count()
      console.log(`Total RFQEmailLog records in database: ${totalEmailLogs}`)
      
      for (const rfq of rfqs) {
        const emailLogCount = await prisma.rFQEmailLog.count({
          where: { rfqId: rfq.id }
        })
        console.log(`RFQ ${rfq.rfqNumber} (${rfq.id}) has ${emailLogCount} email logs`)
      }
    } catch (error: any) {
      console.error('Error accessing RFQEmailLog:', error)
    }
    
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
        items: {
          include: {
            material: {
              include: {
                uom: true
              }
            }
          }
        },
        // quotations: {
        //   include: {
        //     vendor: true,
        //     items: true
        //   }
        // }
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    // Add empty quotations array if not present
    const rfqWithQuotations = {
      ...rfq,
      quotations: rfq.quotations || []
    }
    
    return c.json({ success: true, rfq: rfqWithQuotations })
  } catch (error: any) {
    console.error('Error fetching RFQ:', {
      error: error.message,
      stack: error.stack,
      rfqId: rfqId,
      userId: userId
    })
    return c.json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    }, 500)
  }
})

// Send RFQ to vendors
app.post('/:id/send', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  console.log('=== RFQ Send Request ===')
  console.log('User ID:', userId)
  console.log('RFQ ID:', rfqId)
  
  // Get request body if provided
  let body: any = {}
  try {
    body = await c.req.json()
    console.log('Request body:', body)
  } catch (e) {
    // No body provided, use defaults
    console.log('No request body provided')
  }
  
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
        vendors: true
      }
    })
    
    if (!rfq) {
      return c.json({ 
        success: false, 
        error: 'RFQ not found' 
      }, 404)
    }
    
    // Check if already sent to all vendors
    const allSent = rfq.vendors.every(v => v.emailSent)
    if (rfq.status === 'sent' && allSent) {
      return c.json({ 
        success: false, 
        error: 'RFQ already sent to all vendors. Use resend option for specific vendors.' 
      }, 400)
    }
    
    console.log('RFQ found:', {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      status: rfq.status,
      vendorCount: rfq.vendors.length,
      vendors: rfq.vendors.map(v => ({ id: v.vendorId, emailSent: v.emailSent }))
    })
    
    // Send emails to vendors
    console.log('Calling sendRFQToVendors...')
    // If specific vendorIds provided, pass them to the service
    const result = await procurementAutomation.sendRFQToVendors(
      rfqId, 
      body.vendorIds || undefined,
      {
        customSubject: body.customSubject,
        customBody: body.customBody,
        ccEmails: body.ccEmails,
        userId: userId  // Pass the current user's ID
      }
    )
    console.log('Send result:', result)
    
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

// Resend RFQ to specific vendors
app.post('/:id/resend', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  const { vendorIds } = await c.req.json()
  
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
      }
    })
    
    if (!rfq) {
      return c.json({ error: 'RFQ not found' }, 404)
    }
    
    // Update reminder count for specified vendors
    await prisma.rFQVendor.updateMany({
      where: {
        rfqId: rfqId,
        vendorId: { in: vendorIds }
      },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date()
      }
    })
    
    // Send reminder emails
    const result = await procurementAutomation.sendRFQToVendors(rfqId, vendorIds, {
      isReminder: true
    })
    
    return c.json({
      success: true,
      message: 'RFQ reminders sent',
      ...result
    })
  } catch (error: any) {
    console.error('Error resending RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get RFQ email history
// Clean duplicate email responses
app.post('/:id/clean-duplicates', async (c) => {
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
    
    // Verify RFQ belongs to user's company
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      }
    })
    
    if (!rfq) {
      return c.json({ error: 'RFQ not found' }, 404)
    }
    
    // Find and delete duplicates
    const duplicates = await prisma.$queryRaw`
      WITH DuplicateGroups AS (
        SELECT 
          "emailId", 
          "rfqId", 
          "vendorId",
          MIN("createdAt") as earliest_created
        FROM "RFQEmailResponse"
        WHERE "rfqId" = ${rfqId}
        GROUP BY "emailId", "rfqId", "vendorId"
        HAVING COUNT(*) > 1
      )
      DELETE FROM "RFQEmailResponse" r
      WHERE EXISTS (
        SELECT 1 
        FROM DuplicateGroups dg
        WHERE r."emailId" = dg."emailId"
          AND r."rfqId" = dg."rfqId"
          AND r."vendorId" = dg."vendorId"
          AND r."createdAt" > dg.earliest_created
      )
      RETURNING r.id
    `
    
    const deletedCount = Array.isArray(duplicates) ? duplicates.length : 0
    
    return c.json({
      success: true,
      message: `Cleaned ${deletedCount} duplicate email responses`,
      deletedCount
    })
  } catch (error: any) {
    console.error('Error cleaning duplicates:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/:id/email-history', async (c) => {
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
    
    // Get RFQ with email logs
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      include: {
        emailLogs: {
          where: { rfqId: rfqId },  // Only get logs for this specific RFQ
          include: {
            vendor: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { sentAt: 'desc' }
        },
        emailResponses: {
          where: { rfqId: rfqId },  // Only get responses for this specific RFQ
          include: {
            vendor: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { receivedAt: 'desc' }
        },
        vendors: {
          include: {
            vendor: true
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ error: 'RFQ not found' }, 404)
    }
    
    console.log(`Email history for RFQ ${rfq.rfqNumber}:`, {
      emailLogs: rfq.emailLogs?.length || 0,
      emailResponses: rfq.emailResponses?.length || 0,
      vendors: rfq.vendors?.length || 0
    })
    
    // Debug: Direct query to check email logs
    const directEmailLogCount = await prisma.rFQEmailLog.count({
      where: { rfqId: rfqId }
    })
    console.log(`Direct email log count for RFQ ${rfqId}: ${directEmailLogCount}`)
    
    // Format communication summary
    const communicationSummary = rfq.vendors.map(v => ({
      vendor: v.vendor,
      emailSent: v.emailSent,
      emailSentAt: v.emailSentAt,
      responseReceived: v.responseReceived,
      quotationReceivedAt: v.quotationReceivedAt,
      reminderCount: v.reminderCount,
      lastReminderAt: v.lastReminderAt,
      totalEmails: rfq.emailLogs.filter(log => log.vendorId === v.vendorId).length,
      lastEmail: rfq.emailLogs.find(log => log.vendorId === v.vendorId),
      hasResponse: rfq.emailResponses.some(res => res.vendorId === v.vendorId)
    }))
    
    return c.json({
      success: true,
      rfq: {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        status: rfq.status
      },
      communicationSummary,
      emailLogs: rfq.emailLogs.map(log => ({
        ...log,
        snippet: typeof log.snippet === 'string' ? log.snippet : ''
      })),
      emailResponses: rfq.emailResponses.map(response => ({
        ...response,
        snippet: typeof response.snippet === 'string' 
          ? response.snippet 
          : (typeof response.body === 'string' ? response.body.substring(0, 150) + '...' : 'Email content')
      })),
      stats: {
        totalVendors: rfq.vendors.length,
        emailsSent: rfq.vendors.filter(v => v.emailSent).length,
        responsesReceived: rfq.vendors.filter(v => v.responseReceived).length,
        totalEmailsSent: rfq.emailLogs.length,
        totalResponsesReceived: rfq.emailResponses.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching email history:', error)
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
    
    try {
      // Generate PDF
      const pdfBuffer = await rfqPDFFinal.generateRFQPDF(rfqId)
      
      // Set response headers for PDF
      c.header('Content-Type', 'application/pdf')
      // Use inline to display in browser instead of downloading
      c.header('Content-Disposition', `inline; filename="RFQ_${rfq.rfqNumber}.pdf"`)
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
      c.header('Pragma', 'no-cache')
      c.header('Expires', '0')
      
      // Return PDF buffer
      return c.body(pdfBuffer)
    } catch (pdfError: any) {
      console.error('PDF generation error:', pdfError)
      return c.json({ success: false, error: pdfError.message }, 500)
    }
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
    
    try {
      // Generate vendor-specific PDF
      const pdfBuffer = await rfqPDFFinal.generateVendorRFQPDF(rfqId, vendorId)
      
      // Get vendor info for filename
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { code: true }
      })
      
      const filename = `RFQ_${rfq.rfqNumber}_${vendor?.code || vendorId}.pdf`
      
      // Set response headers for PDF
      c.header('Content-Type', 'application/pdf')
      c.header('Content-Disposition', `inline; filename="${filename}"`)
      
      // Return PDF buffer
      return c.body(pdfBuffer)
    } catch (pdfError: any) {
      console.error('PDF generation error:', pdfError)
      return c.json({ success: false, error: pdfError.message }, 500)
    }
  } catch (error: any) {
    console.error('Error generating vendor RFQ PDF:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app