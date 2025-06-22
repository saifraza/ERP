import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// Validation schemas
const rfqSchema = z.object({
  indentId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['open', 'limited', 'single_source']),
  category: z.enum(['goods', 'services', 'works']),
  dueDate: z.string(),
  openingDate: z.string().optional(),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  warrantyTerms: z.string().optional(),
  specialTerms: z.string().optional(),
  items: z.array(z.object({
    itemName: z.string(),
    description: z.string().optional(),
    specification: z.string().optional(),
    uom: z.string(),
    quantity: z.number(),
    make: z.string().optional(),
    model: z.string().optional(),
  })),
  vendorIds: z.array(z.string())
})

// Get all RFQs
app.get('/', async (c) => {
  const { status, type, page = '1', limit = '20' } = c.req.query()
  
  const rfqs = [
    {
      id: '1',
      rfqNumber: 'RFQ-2025-001',
      title: 'Spare Parts for Sugar Mill',
      type: 'limited',
      category: 'goods',
      issuedDate: '2025-01-20',
      dueDate: '2025-01-27',
      status: 'published',
      vendorsInvited: 5,
      responsesReceived: 3,
      indentNumber: 'IND-2025-001',
      estimatedValue: 50000,
      items: 3
    },
    {
      id: '2',
      rfqNumber: 'RFQ-2025-002',
      title: 'Annual Maintenance Contract - Boilers',
      type: 'open',
      category: 'services',
      issuedDate: '2025-01-19',
      dueDate: '2025-02-05',
      status: 'published',
      vendorsInvited: 8,
      responsesReceived: 2,
      indentNumber: null,
      estimatedValue: 500000,
      items: 1
    }
  ]
  
  let filtered = rfqs
  if (status) filtered = filtered.filter(r => r.status === status)
  if (type) filtered = filtered.filter(r => r.type === type)
  
  return c.json({
    rfqs: filtered,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    }
  })
})

// Get RFQ by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  const rfq = {
    id,
    rfqNumber: 'RFQ-2025-001',
    indentId: '123',
    indentNumber: 'IND-2025-001',
    title: 'Spare Parts for Sugar Mill Maintenance',
    description: 'Procurement of various spare parts for scheduled maintenance of sugar mill equipment',
    type: 'limited',
    category: 'goods',
    issuedDate: '2025-01-20T10:00:00Z',
    dueDate: '2025-01-27T15:00:00Z',
    openingDate: '2025-01-27T16:00:00Z',
    deliveryTerms: 'FOB Factory Gate',
    paymentTerms: '30 days from invoice date',
    warrantyTerms: '12 months from delivery',
    specialTerms: 'All items must be from OEM or authorized dealers',
    status: 'published',
    items: [
      {
        id: '1',
        itemName: 'Ball Bearing 6205',
        description: 'Deep groove ball bearing',
        specification: 'ID: 25mm, OD: 52mm, Width: 15mm',
        uom: 'NOS',
        quantity: 10,
        make: 'SKF/FAG/TIMKEN'
      },
      {
        id: '2',
        itemName: 'V-Belt B-128',
        description: 'Industrial V-Belt',
        specification: 'Type: B, Length: 128 inches',
        uom: 'NOS',
        quantity: 5,
        make: 'Fenner/Gates'
      }
    ],
    vendors: [
      {
        id: '1',
        vendorId: 'VEN-001',
        vendorName: 'Industrial Supplies Co',
        invitedAt: '2025-01-20T10:30:00Z',
        emailSent: true,
        viewed: true,
        viewedAt: '2025-01-20T14:00:00Z',
        responded: true,
        respondedAt: '2025-01-22T11:00:00Z'
      },
      {
        id: '2',
        vendorId: 'VEN-002',
        vendorName: 'Engineering Solutions Ltd',
        invitedAt: '2025-01-20T10:30:00Z',
        emailSent: true,
        viewed: true,
        viewedAt: '2025-01-20T16:00:00Z',
        responded: true,
        respondedAt: '2025-01-23T09:00:00Z'
      }
    ],
    offers: [
      {
        id: '1',
        vendorName: 'Industrial Supplies Co',
        submittedAt: '2025-01-22T11:00:00Z',
        totalAmount: 48500,
        status: 'submitted'
      },
      {
        id: '2',
        vendorName: 'Engineering Solutions Ltd',
        submittedAt: '2025-01-23T09:00:00Z',
        totalAmount: 46800,
        status: 'submitted'
      }
    ]
  }
  
  return c.json(rfq)
})

// Create new RFQ
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = rfqSchema.parse(body)
    
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    const newRfq = {
      id: String(Date.now()),
      rfqNumber,
      ...validated,
      status: 'draft',
      issuedDate: new Date().toISOString(),
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      rfq: newRfq,
      message: 'RFQ created successfully'
    }, 201)
  } catch (error) {
    return c.json({ error: 'Invalid RFQ data' }, 400)
  }
})

// Publish RFQ
app.post('/:id/publish', async (c) => {
  const id = c.req.param('id')
  const { sendEmails = true } = await c.req.json()
  
  return c.json({
    success: true,
    message: 'RFQ published successfully',
    rfq: {
      id,
      status: 'published',
      publishedAt: new Date().toISOString()
    },
    emailsSent: sendEmails ? 5 : 0
  })
})

// Send RFQ emails
app.post('/:id/send-emails', async (c) => {
  const id = c.req.param('id')
  const { vendorIds } = await c.req.json()
  
  // This would integrate with Gmail API via MCP server
  return c.json({
    success: true,
    message: `RFQ emails sent to ${vendorIds.length} vendors`,
    sent: vendorIds.length,
    failed: 0,
    details: vendorIds.map(vendorId => ({
      vendorId,
      status: 'sent',
      messageId: `msg_${Date.now()}_${vendorId}`
    }))
  })
})

// Get vendor responses
app.get('/:id/responses', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    rfqId: id,
    responses: [
      {
        id: '1',
        vendorId: 'VEN-001',
        vendorName: 'Industrial Supplies Co',
        submittedAt: '2025-01-22T11:00:00Z',
        totalAmount: 48500,
        validUntil: '2025-02-27',
        paymentTerms: '30 days',
        deliveryPeriod: '7 days',
        status: 'submitted',
        technicalScore: null,
        commercialScore: null,
        items: [
          {
            itemName: 'Ball Bearing 6205',
            quantity: 10,
            rate: 485,
            amount: 4850
          },
          {
            itemName: 'V-Belt B-128',
            quantity: 5,
            rate: 1170,
            amount: 5850
          }
        ]
      },
      {
        id: '2',
        vendorId: 'VEN-002',
        vendorName: 'Engineering Solutions Ltd',
        submittedAt: '2025-01-23T09:00:00Z',
        totalAmount: 46800,
        validUntil: '2025-02-27',
        paymentTerms: '45 days',
        deliveryPeriod: '10 days',
        status: 'submitted',
        technicalScore: null,
        commercialScore: null,
        items: [
          {
            itemName: 'Ball Bearing 6205',
            quantity: 10,
            rate: 465,
            amount: 4650
          },
          {
            itemName: 'V-Belt B-128',
            quantity: 5,
            rate: 1160,
            amount: 5800
          }
        ]
      }
    ]
  })
})

// Generate comparison statement
app.get('/:id/comparison', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    rfqId: id,
    rfqNumber: 'RFQ-2025-001',
    comparisonDate: new Date().toISOString(),
    items: [
      {
        itemName: 'Ball Bearing 6205',
        quantity: 10,
        uom: 'NOS',
        vendors: [
          {
            vendorName: 'Industrial Supplies Co',
            rate: 485,
            amount: 4850,
            make: 'SKF',
            delivery: '7 days',
            isL1: false
          },
          {
            vendorName: 'Engineering Solutions Ltd',
            rate: 465,
            amount: 4650,
            make: 'FAG',
            delivery: '10 days',
            isL1: true
          }
        ]
      },
      {
        itemName: 'V-Belt B-128',
        quantity: 5,
        uom: 'NOS',
        vendors: [
          {
            vendorName: 'Industrial Supplies Co',
            rate: 1170,
            amount: 5850,
            make: 'Fenner',
            delivery: '7 days',
            isL1: false
          },
          {
            vendorName: 'Engineering Solutions Ltd',
            rate: 1160,
            amount: 5800,
            make: 'Gates',
            delivery: '10 days',
            isL1: true
          }
        ]
      }
    ],
    summary: {
      totalVendors: 2,
      lowestTotal: 46800,
      lowestVendor: 'Engineering Solutions Ltd',
      averageTotal: 47650,
      savingsFromEstimate: 3200
    }
  })
})

// Close RFQ
app.post('/:id/close', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    success: true,
    message: 'RFQ closed successfully',
    rfq: {
      id,
      status: 'closed',
      closedAt: new Date().toISOString()
    }
  })
})

// Analytics
app.get('/analytics/summary', async (c) => {
  return c.json({
    summary: {
      total: 45,
      active: 12,
      closed: 28,
      cancelled: 5
    },
    responseRate: {
      average: 75, // percentage
      byType: {
        open: 65,
        limited: 85,
        single_source: 100
      }
    },
    savings: {
      totalEstimated: 5000000,
      totalActual: 4500000,
      savingsAmount: 500000,
      savingsPercentage: 10
      },
    processingTime: {
      average: 7.5, // days
      byType: {
        open: 12,
        limited: 7,
        single_source: 3
      }
    },
    trends: {
      monthly: [
        { month: 'Jan', count: 15, value: 1500000 },
        { month: 'Feb', count: 18, value: 2000000 },
        { month: 'Mar', count: 12, value: 1000000 }
      ]
    }
  })
})

export default app