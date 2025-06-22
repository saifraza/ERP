import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// Validation schemas
const indentSchema = z.object({
  division: z.enum(['sugar', 'power', 'ethanol', 'feed']),
  department: z.string(),
  type: z.enum(['regular', 'urgent', 'annual_contract']),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  requiredBy: z.string(), // Date string
  purpose: z.string(),
  costCenter: z.string().optional(),
  budgetCode: z.string().optional(),
  estimatedValue: z.number().optional(),
  items: z.array(z.object({
    itemName: z.string(),
    description: z.string().optional(),
    specification: z.string().optional(),
    uom: z.string(),
    quantity: z.number(),
    rate: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
  }))
})

// Get all indents with filters
app.get('/', async (c) => {
  const { status, division, priority, page = '1', limit = '20' } = c.req.query()
  
  const indents = [
    {
      id: '1',
      indentNumber: 'IND-2025-001',
      division: 'sugar',
      department: 'Maintenance',
      type: 'regular',
      priority: 'normal',
      requestedBy: 'John Doe',
      requestedDate: '2025-01-20',
      requiredBy: '2025-02-20',
      purpose: 'Routine maintenance spare parts',
      estimatedValue: 50000,
      status: 'approved',
      items: 3,
      level1Status: 'approved',
      level1By: 'Manager',
      level2Status: 'approved',
      level2By: 'HOD'
    },
    {
      id: '2',
      indentNumber: 'IND-2025-002',
      division: 'power',
      department: 'Operations',
      type: 'urgent',
      priority: 'high',
      requestedBy: 'Jane Smith',
      requestedDate: '2025-01-21',
      requiredBy: '2025-01-25',
      purpose: 'Boiler tube replacement',
      estimatedValue: 150000,
      status: 'submitted',
      items: 5,
      level1Status: 'pending',
      level1By: null,
      level2Status: null,
      level2By: null
    }
  ]
  
  let filtered = indents
  if (status) filtered = filtered.filter(i => i.status === status)
  if (division) filtered = filtered.filter(i => i.division === division)
  if (priority) filtered = filtered.filter(i => i.priority === priority)
  
  return c.json({
    indents: filtered,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    }
  })
})

// Get indent by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  const indent = {
    id,
    indentNumber: 'IND-2025-001',
    division: 'sugar',
    department: 'Maintenance',
    type: 'regular',
    priority: 'normal',
    requestedBy: 'John Doe',
    requestedDate: '2025-01-20',
    requiredBy: '2025-02-20',
    purpose: 'Routine maintenance spare parts for sugar mill',
    costCenter: 'CC-SUG-001',
    budgetCode: 'BUD-2025-MAINT-001',
    estimatedValue: 50000,
    status: 'approved',
    level1Status: 'approved',
    level1By: 'Plant Manager',
    level1At: '2025-01-21T10:00:00Z',
    level1Remarks: 'Approved. Urgent requirement.',
    level2Status: 'approved',
    level2By: 'Division Head',
    level2At: '2025-01-21T14:00:00Z',
    level2Remarks: 'Approved within budget.',
    items: [
      {
        id: '1',
        itemName: 'Ball Bearing 6205',
        description: 'Deep groove ball bearing',
        specification: 'ID: 25mm, OD: 52mm, Width: 15mm',
        uom: 'NOS',
        quantity: 10,
        rate: 500,
        amount: 5000,
        make: 'SKF',
        lastPurchaseRate: 480,
        lastVendor: 'Industrial Supplies Co',
        lastPurchaseDate: '2024-12-15'
      },
      {
        id: '2',
        itemName: 'V-Belt B-128',
        description: 'Industrial V-Belt',
        specification: 'Type: B, Length: 128 inches',
        uom: 'NOS',
        quantity: 5,
        rate: 1200,
        amount: 6000,
        make: 'Fenner',
        lastPurchaseRate: 1150,
        lastVendor: 'Engineering Solutions Ltd',
        lastPurchaseDate: '2024-11-20'
      }
    ],
    approvalFlow: [
      {
        level: 1,
        approver: 'Plant Manager',
        status: 'approved',
        date: '2025-01-21T10:00:00Z',
        remarks: 'Approved. Urgent requirement.'
      },
      {
        level: 2,
        approver: 'Division Head',
        status: 'approved',
        date: '2025-01-21T14:00:00Z',
        remarks: 'Approved within budget.'
      }
    ]
  }
  
  return c.json(indent)
})

// Create new indent
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = indentSchema.parse(body)
    
    // Generate indent number
    const indentNumber = `IND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    // Calculate total estimated value
    const estimatedValue = validated.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.rate || 0))
    }, 0)
    
    const newIndent = {
      id: String(Date.now()),
      indentNumber,
      ...validated,
      estimatedValue,
      status: 'draft',
      requestedBy: 'current-user',
      requestedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      indent: newIndent,
      message: 'Indent created successfully'
    }, 201)
  } catch (error) {
    return c.json({ error: 'Invalid indent data' }, 400)
  }
})

// Submit indent for approval
app.post('/:id/submit', async (c) => {
  const id = c.req.param('id')
  
  return c.json({
    success: true,
    message: 'Indent submitted for approval',
    indent: {
      id,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    }
  })
})

// Approve/Reject indent
app.post('/:id/approve', async (c) => {
  const id = c.req.param('id')
  const { level, action, remarks } = await c.req.json()
  
  const status = action === 'approve' ? 'approved' : 'rejected'
  
  return c.json({
    success: true,
    message: `Indent ${status} at level ${level}`,
    indent: {
      id,
      [`level${level}Status`]: status,
      [`level${level}By`]: 'current-user',
      [`level${level}At`]: new Date().toISOString(),
      [`level${level}Remarks`]: remarks,
      status: level === 2 && action === 'approve' ? 'approved' : 'submitted'
    }
  })
})

// Convert indent to RFQ
app.post('/:id/convert-to-rfq', async (c) => {
  const id = c.req.param('id')
  const { vendorIds, dueDate, terms } = await c.req.json()
  
  return c.json({
    success: true,
    message: 'RFQ created from indent',
    rfq: {
      id: String(Date.now()),
      rfqNumber: `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      indentId: id,
      vendorIds,
      dueDate,
      terms,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  })
})

// Get indent analytics
app.get('/analytics/summary', async (c) => {
  return c.json({
    summary: {
      total: 156,
      pending: 23,
      approved: 98,
      rejected: 12,
      converted: 85
    },
    byDivision: {
      sugar: { total: 45, pending: 8, approved: 30 },
      power: { total: 38, pending: 5, approved: 28 },
      ethanol: { total: 42, pending: 6, approved: 32 },
      feed: { total: 31, pending: 4, approved: 18 }
    },
    byPriority: {
      critical: 5,
      high: 28,
      normal: 98,
      low: 25
    },
    trends: {
      monthly: [
        { month: 'Jan', count: 45, value: 2500000 },
        { month: 'Feb', count: 52, value: 3200000 },
        { month: 'Mar', count: 38, value: 1800000 }
      ]
    },
    avgApprovalTime: {
      regular: 2.5, // days
      urgent: 0.5,
      annual_contract: 5
    }
  })
})

// Bulk indent actions
app.post('/bulk/approve', async (c) => {
  const { indentIds, level, remarks } = await c.req.json()
  
  return c.json({
    success: true,
    message: `Approved ${indentIds.length} indents at level ${level}`,
    approved: indentIds.length,
    failed: 0
  })
})

export default app