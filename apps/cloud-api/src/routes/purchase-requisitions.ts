import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// PR creation schema
const prItemSchema = z.object({
  itemCode: z.string().min(1),
  itemDescription: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  estimatedPrice: z.number().optional(),
  specifications: z.string().optional(),
  preferredVendor: z.string().optional(),
  justification: z.string().optional()
})

const prSchema = z.object({
  divisionId: z.string().uuid(),
  departmentId: z.string().optional(),
  requiredBy: z.string(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  notes: z.string().optional(),
  items: z.array(prItemSchema).min(1)
})

// Generate PR number
async function generatePRNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Get last PR number for this month
  const lastPR = await prisma.purchaseRequisition.findFirst({
    where: {
      companyId,
      prNumber: {
        startsWith: `PR-${year}${month}`
      }
    },
    orderBy: { prNumber: 'desc' },
    select: { prNumber: true }
  })
  
  let sequence = 1
  if (lastPR) {
    const lastSequence = parseInt(lastPR.prNumber.split('-').pop() || '0')
    sequence = lastSequence + 1
  }
  
  return `PR-${year}${month}-${String(sequence).padStart(4, '0')}`
}

// Get all PRs
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { status, divisionId, priority, from, to } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, prs: [] })
    }
    
    const where: any = {
      companyId: companyId
    }
    
    if (status) where.status = status
    if (divisionId) where.divisionId = divisionId
    if (priority) where.priority = priority
    
    if (from || to) {
      where.requestDate = {}
      if (from) where.requestDate.gte = new Date(from)
      if (to) where.requestDate.lte = new Date(to)
    }
    
    const prs = await prisma.purchaseRequisition.findMany({
      where,
      include: {
        division: {
          select: { name: true }
        },
        items: true,
        _count: {
          select: { rfqs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return c.json({ success: true, prs })
  } catch (error: any) {
    console.error('Error fetching PRs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single PR
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
  try {
    // Get user's company and user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        companyAccess: {
          select: { companyId: true }
        }
      }
    })
    
    const companyId = user?.companyAccess[0]?.companyId
    
    if (!companyId) {
      return c.json({ success: false, error: 'Company not found' }, 404)
    }
    
    const pr = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: companyId
      },
      include: {
        company: {
          select: { name: true }
        },
        division: {
          select: { name: true }
        },
        items: true,
        rfqs: {
          include: {
            _count: {
              select: { quotations: true }
            }
          }
        }
      }
    })
    
    if (!pr) {
      return c.json({ success: false, error: 'PR not found' }, 404)
    }
    
    // Format response with proper structure
    const formattedPR = {
      id: pr.id,
      prNumber: pr.prNumber,
      title: `Purchase Requisition - ${pr.division.name}`,
      description: pr.notes,
      division: pr.divisionId,
      status: pr.status,
      priority: pr.priority,
      createdAt: pr.createdAt,
      requiredBy: pr.requiredBy,
      items: pr.items.map(item => ({
        id: item.id,
        materialId: item.itemCode,
        material: {
          code: item.itemCode,
          name: item.itemDescription,
          description: item.specifications,
          unit: item.unit,
          specifications: item.specifications
        },
        quantity: item.quantity,
        requiredBy: pr.requiredBy,
        preferredVendorId: item.preferredVendor,
        purpose: item.justification || 'General requirement',
        estimatedCost: item.estimatedPrice
      })),
      requestor: {
        name: pr.requestedBy,
        email: user?.email || ''
      },
      approvals: [
        {
          id: '1',
          level: 'Department Head',
          approverName: pr.approvedBy || 'Pending',
          status: pr.status === 'approved' ? 'approved' : pr.status === 'rejected' ? 'rejected' : 'pending',
          approvedAt: pr.approvalDate,
          comments: pr.rejectionReason
        }
      ],
      totalAmount: pr.items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * item.quantity, 0),
      company: {
        name: pr.company.name
      }
    }
    
    return c.json({ success: true, pr: formattedPR })
  } catch (error: any) {
    console.error('Error fetching PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new PR
app.post('/', async (c) => {
  const userId = c.get('userId')
  const userName = c.get('userEmail') || 'User'
  
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
    const validated = prSchema.parse(body)
    
    // Generate PR number
    const prNumber = await generatePRNumber(companyId)
    
    // Parse required by date
    const requiredBy = new Date(validated.requiredBy)
    if (requiredBy < new Date()) {
      return c.json({ 
        success: false, 
        error: 'Required by date cannot be in the past' 
      }, 400)
    }
    
    const pr = await prisma.purchaseRequisition.create({
      data: {
        companyId: companyId,
        prNumber,
        divisionId: validated.divisionId,
        departmentId: validated.departmentId,
        requestedBy: userName,
        requestDate: new Date(),
        requiredBy,
        priority: validated.priority,
        status: 'draft',
        notes: validated.notes,
        items: {
          create: validated.items
        }
      },
      include: {
        items: true,
        division: true
      }
    })
    
    return c.json({ success: true, pr })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update PR
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
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
    
    // Check if PR exists and is in draft status
    const existing = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: companyId
      }
    })
    
    if (!existing) {
      return c.json({ success: false, error: 'PR not found' }, 404)
    }
    
    if (existing.status !== 'draft') {
      return c.json({ 
        success: false, 
        error: 'Cannot update PR that is not in draft status' 
      }, 400)
    }
    
    // Update PR and items
    const pr = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.pRItem.deleteMany({
        where: { prId }
      })
      
      // Update PR
      return await tx.purchaseRequisition.update({
        where: { id: prId },
        data: {
          divisionId: body.divisionId || existing.divisionId,
          departmentId: body.departmentId,
          requiredBy: body.requiredBy ? new Date(body.requiredBy) : existing.requiredBy,
          priority: body.priority || existing.priority,
          notes: body.notes,
          items: {
            create: body.items || []
          }
        },
        include: {
          items: true,
          division: true
        }
      })
    })
    
    return c.json({ success: true, pr })
  } catch (error: any) {
    console.error('Error updating PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Submit PR for approval
app.post('/:id/submit', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
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
    
    const pr = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: companyId,
        status: 'draft'
      },
      include: {
        items: true
      }
    })
    
    if (!pr) {
      return c.json({ 
        success: false, 
        error: 'PR not found or already submitted' 
      }, 404)
    }
    
    if (pr.items.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot submit PR without items' 
      }, 400)
    }
    
    const updated = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: { 
        status: 'submitted',
        updatedAt: new Date()
      }
    })
    
    // TODO: Send notification to approvers
    
    return c.json({ 
      success: true, 
      pr: updated,
      message: 'PR submitted for approval'
    })
  } catch (error: any) {
    console.error('Error submitting PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Approve PR
app.post('/:id/approve', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
  try {
    const { comments } = await c.req.json()
    
    // Get user's company and name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        companyAccess: {
          select: { companyId: true }
        }
      }
    })
    
    const companyId = user?.companyAccess[0]?.companyId
    
    if (!companyId) {
      return c.json({ 
        success: false, 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    const pr = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: companyId,
        status: 'submitted'
      }
    })
    
    if (!pr) {
      return c.json({ 
        success: false, 
        error: 'PR not found or not in submitted status' 
      }, 404)
    }
    
    // TODO: Check if user has approval rights
    
    const updated = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: {
        status: 'approved',
        approvedBy: user?.name || 'Unknown',
        approvalDate: new Date(),
        updatedAt: new Date()
      }
    })
    
    return c.json({ 
      success: true, 
      pr: updated,
      message: 'PR approved successfully'
    })
  } catch (error: any) {
    console.error('Error approving PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Reject PR
app.post('/:id/reject', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
  try {
    const { comments } = await c.req.json()
    
    if (!comments || comments.trim() === '') {
      return c.json({ 
        success: false, 
        error: 'Rejection reason is required' 
      }, 400)
    }
    
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
    
    const pr = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: companyId,
        status: 'submitted'
      }
    })
    
    if (!pr) {
      return c.json({ 
        success: false, 
        error: 'PR not found or not in submitted status' 
      }, 404)
    }
    
    // TODO: Check if user has approval rights
    
    const updated = await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: {
        status: 'rejected',
        rejectionReason: comments,
        updatedAt: new Date()
      }
    })
    
    return c.json({ 
      success: true, 
      pr: updated,
      message: 'PR rejected successfully'
    })
  } catch (error: any) {
    console.error('Error rejecting PR:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Convert PR to RFQ
app.post('/:id/convert-to-rfq', async (c) => {
  const userId = c.get('userId')
  const prId = c.req.param('id')
  
  try {
    const { vendorIds, dueDate, terms } = await c.req.json()
    
    if (!vendorIds || vendorIds.length === 0) {
      return c.json({ 
        success: false, 
        error: 'At least one vendor must be selected' 
      }, 400)
    }
    
    const pr = await prisma.purchaseRequisition.findFirst({
      where: {
        id: prId,
        companyId: user.companyId,
        status: 'approved'
      },
      include: {
        items: true
      }
    })
    
    if (!pr) {
      return c.json({ 
        success: false, 
        error: 'PR not found or not approved' 
      }, 404)
    }
    
    // Generate RFQ number
    const year = new Date().getFullYear()
    const lastRFQ = await prisma.rFQ.findFirst({
      where: {
        companyId: user.companyId,
        rfqNumber: { startsWith: `RFQ-${year}` }
      },
      orderBy: { rfqNumber: 'desc' },
      select: { rfqNumber: true }
    })
    
    let sequence = 1
    if (lastRFQ) {
      const lastSequence = parseInt(lastRFQ.rfqNumber.split('-').pop() || '0')
      sequence = lastSequence + 1
    }
    
    const rfqNumber = `RFQ-${year}-${String(sequence).padStart(4, '0')}`
    
    // Create RFQ
    const rfq = await prisma.rFQ.create({
      data: {
        companyId: user.companyId,
        rfqNumber,
        prId,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        status: 'draft',
        terms,
        createdBy: user.name,
        vendors: {
          create: vendorIds.map((vendorId: string) => ({
            vendorId
          }))
        },
        items: {
          create: pr.items.map(item => ({
            itemCode: item.itemCode,
            itemDescription: item.itemDescription,
            quantity: item.quantity,
            unit: item.unit,
            specifications: item.specifications
          }))
        }
      },
      include: {
        vendors: true,
        items: true
      }
    })
    
    // Update PR status
    await prisma.purchaseRequisition.update({
      where: { id: prId },
      data: { status: 'converted' }
    })
    
    return c.json({ 
      success: true, 
      rfq,
      message: 'PR converted to RFQ successfully'
    })
  } catch (error: any) {
    console.error('Error converting PR to RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app