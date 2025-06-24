import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { procurementAutomation } from '../services/procurement-automation.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Get all RFQs
app.get('/', async (c) => {
  const user = c.get('user')
  const { status, from, to } = c.req.query()
  
  try {
    const where: any = {
      companyId: user.companyId
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
        pr: {
          select: {
            prNumber: true,
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
    
    return c.json({ success: true, rfqs })
  } catch (error: any) {
    console.error('Error fetching RFQs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single RFQ
app.get('/:id', async (c) => {
  const user = c.get('user')
  const rfqId = c.req.param('id')
  
  try {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: user.companyId
      },
      include: {
        pr: {
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
  const user = c.get('user')
  const rfqId = c.req.param('id')
  
  try {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: user.companyId,
        status: 'draft'
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
  const user = c.get('user')
  const rfqId = c.req.param('id')
  
  try {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: user.companyId,
        status: 'sent'
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
        status: 'closed',
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
  const user = c.get('user')
  const rfqId = c.req.param('id')
  
  try {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: user.companyId
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
        dueDate: rfq.dueDate
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
  const user = c.get('user')
  const rfqId = c.req.param('id')
  
  try {
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
        companyId: user.companyId
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
            comparedBy: user.name,
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

export default app