import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// Validation schemas
const poSchema = z.object({
  vendorId: z.string(),
  offerId: z.string().optional(),
  division: z.string(),
  department: z.string(),
  deliveryDate: z.string(),
  deliveryAddress: z.string(),
  billingAddress: z.string(),
  paymentTerms: z.string(),
  deliveryTerms: z.string(),
  items: z.array(z.object({
    itemCode: z.string().optional(),
    itemName: z.string(),
    description: z.string().optional(),
    uom: z.string(),
    quantity: z.number(),
    rate: z.number(),
    taxRate: z.number().optional(),
  })),
  otherCharges: z.number().default(0),
  remarks: z.string().optional()
})

// Get all purchase orders
app.get('/', async (c) => {
  const { status, vendorId, division, page = '1', limit = '20' } = c.req.query()
  
  const purchaseOrders = [
    {
      id: '1',
      poNumber: 'PO-2025-001',
      vendorName: 'Industrial Supplies Co',
      vendorCode: 'VEN-2025-001',
      orderDate: '2025-01-25',
      deliveryDate: '2025-02-05',
      division: 'sugar',
      department: 'Maintenance',
      totalAmount: 55000,
      status: 'approved',
      items: 3,
      receivedQty: 0,
      pendingQty: 3
    },
    {
      id: '2',
      poNumber: 'PO-2025-002',
      vendorName: 'Engineering Solutions Ltd',
      vendorCode: 'VEN-2025-002',
      orderDate: '2025-01-24',
      deliveryDate: '2025-02-10',
      division: 'power',
      department: 'Operations',
      totalAmount: 125000,
      status: 'sent',
      items: 5,
      receivedQty: 0,
      pendingQty: 5
    }
  ]
  
  let filtered = purchaseOrders
  if (status) filtered = filtered.filter(po => po.status === status)
  if (vendorId) filtered = filtered.filter(po => po.vendorCode === vendorId)
  if (division) filtered = filtered.filter(po => po.division === division)
  
  return c.json({
    purchaseOrders: filtered,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    }
  })
})

// Get PO by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  const purchaseOrder = {
    id,
    poNumber: 'PO-2025-001',
    revision: 0,
    vendorId: 'VEN-001',
    vendorName: 'Industrial Supplies Co',
    vendorCode: 'VEN-2025-001',
    vendorAddress: '123, Industrial Area, Mumbai',
    vendorGST: '27AABCI1234D1Z5',
    offerId: 'OFF-001',
    rfqNumber: 'RFQ-2025-001',
    orderDate: '2025-01-25T10:00:00Z',
    deliveryDate: '2025-02-05',
    division: 'sugar',
    department: 'Maintenance',
    deliveryAddress: 'Sugar Factory, Gate 2, Industrial Area',
    billingAddress: 'Ethanol & Sugar Factory, Main Office',
    paymentTerms: '30 days from invoice date',
    deliveryTerms: 'FOB Factory Gate',
    basicAmount: 48500,
    taxAmount: 8730,
    otherCharges: 500,
    totalAmount: 57730,
    status: 'approved',
    approvedBy: 'Purchase Head',
    approvedAt: '2025-01-25T14:00:00Z',
    items: [
      {
        id: '1',
        itemCode: 'BRG-6205',
        itemName: 'Ball Bearing 6205',
        description: 'Deep groove ball bearing',
        uom: 'NOS',
        quantity: 10,
        rate: 485,
        amount: 4850,
        taxRate: 18,
        taxAmount: 873,
        totalAmount: 5723,
        receivedQty: 0,
        pendingQty: 10
      },
      {
        id: '2',
        itemCode: 'VB-128',
        itemName: 'V-Belt B-128',
        description: 'Industrial V-Belt',
        uom: 'NOS',
        quantity: 5,
        rate: 1170,
        amount: 5850,
        taxRate: 18,
        taxAmount: 1053,
        totalAmount: 6903,
        receivedQty: 0,
        pendingQty: 5
      }
    ],
    termsAndConditions: [
      'Delivery within specified date is mandatory',
      'All items must be as per specifications',
      'Warranty as per standard terms',
      'Payment will be released after quality approval'
    ],
    approvalHistory: [
      {
        level: 'Department Head',
        approvedBy: 'John Doe',
        approvedAt: '2025-01-25T11:00:00Z',
        remarks: 'Urgent requirement'
      },
      {
        level: 'Purchase Head',
        approvedBy: 'Jane Smith',
        approvedAt: '2025-01-25T14:00:00Z',
        remarks: 'Approved. Best price.'
      }
    ]
  }
  
  return c.json(purchaseOrder)
})

// Create new PO
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = poSchema.parse(body)
    
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    // Calculate amounts
    let basicAmount = 0
    let taxAmount = 0
    
    const items = validated.items.map(item => {
      const amount = item.quantity * item.rate
      const itemTax = amount * (item.taxRate || 18) / 100
      basicAmount += amount
      taxAmount += itemTax
      
      return {
        ...item,
        amount,
        taxAmount: itemTax,
        totalAmount: amount + itemTax,
        receivedQty: 0,
        pendingQty: item.quantity
      }
    })
    
    const totalAmount = basicAmount + taxAmount + validated.otherCharges
    
    const newPO = {
      id: String(Date.now()),
      poNumber,
      revision: 0,
      ...validated,
      items,
      basicAmount,
      taxAmount,
      totalAmount,
      status: 'draft',
      orderDate: new Date().toISOString(),
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      purchaseOrder: newPO,
      message: 'Purchase order created successfully'
    }, 201)
  } catch (error) {
    return c.json({ error: 'Invalid purchase order data' }, 400)
  }
})

// Update PO
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  return c.json({
    success: true,
    purchaseOrder: { id, ...body },
    message: 'Purchase order updated successfully'
  })
})

// Approve PO
app.post('/:id/approve', async (c) => {
  const id = c.req.param('id')
  const { remarks } = await c.req.json()
  
  return c.json({
    success: true,
    message: 'Purchase order approved successfully',
    purchaseOrder: {
      id,
      status: 'approved',
      approvedBy: 'current-user',
      approvedAt: new Date().toISOString(),
      remarks
    }
  })
})

// Send PO to vendor
app.post('/:id/send', async (c) => {
  const id = c.req.param('id')
  const { emailMessage } = await c.req.json()
  
  // This would integrate with Gmail API
  return c.json({
    success: true,
    message: 'Purchase order sent to vendor',
    purchaseOrder: {
      id,
      status: 'sent',
      sentAt: new Date().toISOString()
    },
    email: {
      to: 'vendor@example.com',
      subject: 'Purchase Order PO-2025-001',
      messageId: `msg_${Date.now()}`
    }
  })
})

// Get PO receipts
app.get('/:id/receipts', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    receipts: [
      {
        id: '1',
        grnNumber: 'GRN-2025-001',
        receiptDate: '2025-02-05',
        challanNumber: 'CH-12345',
        challanDate: '2025-02-05',
        vehicleNumber: 'MH-12-AB-1234',
        items: [
          {
            itemName: 'Ball Bearing 6205',
            orderedQty: 10,
            receivedQty: 10,
            acceptedQty: 10,
            rejectedQty: 0
          }
        ],
        qualityStatus: 'passed',
        inspectedBy: 'QC Team'
      }
    ]
  })
})

// Cancel PO
app.post('/:id/cancel', async (c) => {
  const id = c.req.param('id')
  const { reason } = await c.req.json()
  
  return c.json({
    success: true,
    message: 'Purchase order cancelled',
    purchaseOrder: {
      id,
      status: 'cancelled',
      cancelledBy: 'current-user',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    }
  })
})

// PO analytics
app.get('/analytics/summary', async (c) => {
  return c.json({
    summary: {
      total: 234,
      draft: 12,
      approved: 45,
      sent: 156,
      completed: 198,
      cancelled: 5
    },
    valueAnalysis: {
      totalValue: 25000000,
      averageValue: 106837,
      largestPO: 850000,
      smallestPO: 5000
    },
    vendorDistribution: {
      topVendors: [
        { name: 'Industrial Supplies Co', count: 45, value: 5000000 },
        { name: 'Engineering Solutions Ltd', count: 38, value: 4500000 },
        { name: 'Technical Services Inc', count: 32, value: 3800000 }
      ]
    },
    divisionWise: {
      sugar: { count: 78, value: 8500000 },
      power: { count: 65, value: 7200000 },
      ethanol: { count: 52, value: 5800000 },
      feed: { count: 39, value: 3500000 }
    },
    deliveryPerformance: {
      onTime: 85, // percentage
      delayed: 12,
      advance: 3
    },
    trends: {
      monthly: [
        { month: 'Jan', count: 78, value: 8500000 },
        { month: 'Feb', count: 82, value: 9200000 },
        { month: 'Mar', count: 74, value: 7300000 }
      ]
    }
  })
})

// Get pending deliveries
app.get('/pending-deliveries', async (c) => {
  return c.json({
    pendingDeliveries: [
      {
        poNumber: 'PO-2025-001',
        vendorName: 'Industrial Supplies Co',
        deliveryDate: '2025-02-05',
        daysRemaining: 3,
        items: 3,
        totalValue: 55000,
        status: 'on_track'
      },
      {
        poNumber: 'PO-2025-002',
        vendorName: 'Engineering Solutions Ltd',
        deliveryDate: '2025-02-02',
        daysRemaining: -1,
        items: 5,
        totalValue: 125000,
        status: 'delayed'
      }
    ]
  })
})

export default app