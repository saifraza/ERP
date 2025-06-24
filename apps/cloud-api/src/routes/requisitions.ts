import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Requisition item schema with materialId
const requisitionItemSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().positive(),
  requiredDate: z.string(),
  specification: z.string().optional(),
  remarks: z.string().optional()
})

const requisitionSchema = z.object({
  factoryId: z.string().uuid(),
  department: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(requisitionItemSchema).min(1)
})

// Generate requisition number
async function generateRequisitionNumber(factoryId: string): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Get last requisition number for this month
  const lastRequisition = await prisma.requisition.findFirst({
    where: {
      factoryId,
      requisitionNo: {
        startsWith: `REQ-${year}${month}`
      }
    },
    orderBy: { requisitionNo: 'desc' },
    select: { requisitionNo: true }
  })
  
  let sequence = 1
  if (lastRequisition) {
    const lastSequence = parseInt(lastRequisition.requisitionNo.split('-').pop() || '0')
    sequence = lastSequence + 1
  }
  
  return `REQ-${year}${month}-${String(sequence).padStart(4, '0')}`
}

// Get all requisitions
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { status, factoryId, priority, from, to, department } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, requisitions: [] })
    }
    
    const where: any = {
      factory: {
        companyId: companyId
      }
    }
    
    if (status) where.status = status
    if (factoryId) where.factoryId = factoryId
    if (priority) where.priority = priority
    if (department) where.department = { contains: department, mode: 'insensitive' }
    
    if (from || to) {
      where.requisitionDate = {}
      if (from) where.requisitionDate.gte = new Date(from)
      if (to) where.requisitionDate.lte = new Date(to)
    }
    
    const requisitions = await prisma.requisition.findMany({
      where,
      include: {
        factory: {
          select: { name: true, code: true }
        },
        items: {
          include: {
            material: {
              select: {
                code: true,
                name: true,
                description: true,
                uom: {
                  select: { code: true }
                }
              }
            }
          }
        },
        requestedByUser: {
          select: { name: true, email: true }
        },
        approvedByUser: {
          select: { name: true, email: true }
        },
        _count: {
          select: { purchaseOrders: true }
        }
      },
      orderBy: { requisitionDate: 'desc' }
    })
    
    // Format the response
    const formattedRequisitions = requisitions.map(req => ({
      id: req.id,
      requisitionNo: req.requisitionNo,
      requisitionDate: req.requisitionDate,
      department: req.department,
      priority: req.priority,
      purpose: req.purpose,
      status: req.status,
      requestedBy: req.requestedByUser.name,
      approvedBy: req.approvedByUser?.name,
      approvedDate: req.approvedDate,
      remarks: req.remarks,
      factory: req.factory,
      items: req.items.map(item => ({
        id: item.id,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        materialDescription: item.material.description,
        quantity: item.quantity,
        unit: item.material.uom.code,
        requiredDate: item.requiredDate,
        specification: item.specification,
        remarks: item.remarks
      })),
      totalItems: req.items.length,
      poCount: req._count.purchaseOrders,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }))
    
    return c.json({ success: true, requisitions: formattedRequisitions })
  } catch (error: any) {
    console.error('Error fetching requisitions:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single requisition
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: false, error: 'User not associated with a company' }, 400)
    }
    
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        }
      },
      include: {
        factory: {
          select: { name: true, code: true }
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
        requestedByUser: {
          select: { name: true, email: true }
        },
        approvedByUser: {
          select: { name: true, email: true }
        },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            poDate: true,
            status: true,
            vendor: {
              select: { name: true }
            }
          }
        }
      }
    })
    
    if (!requisition) {
      return c.json({ success: false, error: 'Requisition not found' }, 404)
    }
    
    // Format the response
    const formattedRequisition = {
      id: requisition.id,
      requisitionNo: requisition.requisitionNo,
      requisitionDate: requisition.requisitionDate,
      department: requisition.department,
      priority: requisition.priority,
      purpose: requisition.purpose,
      status: requisition.status,
      requestedBy: requisition.requestedByUser.name,
      requestedByEmail: requisition.requestedByUser.email,
      approvedBy: requisition.approvedByUser?.name,
      approvedByEmail: requisition.approvedByUser?.email,
      approvedDate: requisition.approvedDate,
      remarks: requisition.remarks,
      factory: requisition.factory,
      items: requisition.items.map(item => ({
        id: item.id,
        material: {
          id: item.material.id,
          code: item.material.code,
          name: item.material.name,
          description: item.material.description,
          unit: item.material.uom.code,
          specifications: item.material.specifications,
          category: item.material.category,
          criticalItem: item.material.isCritical,
          reorderLevel: item.material.reorderLevel,
          leadTimeDays: item.material.leadTimeDays
        },
        quantity: item.quantity,
        requiredDate: item.requiredDate,
        specification: item.specification,
        remarks: item.remarks
      })),
      purchaseOrders: requisition.purchaseOrders,
      createdAt: requisition.createdAt,
      updatedAt: requisition.updatedAt
    }
    
    return c.json({ success: true, requisition: formattedRequisition })
  } catch (error: any) {
    console.error('Error fetching requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new requisition
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
    const validated = requisitionSchema.parse(body)
    
    // Verify factory belongs to company
    const factory = await prisma.factory.findFirst({
      where: {
        id: validated.factoryId,
        companyId: companyId
      }
    })
    
    if (!factory) {
      return c.json({ 
        success: false, 
        error: 'Invalid factory' 
      }, 400)
    }
    
    // Generate requisition number
    const requisitionNo = await generateRequisitionNumber(validated.factoryId)
    
    // Validate all materials exist and belong to company
    const materialIds = validated.items.map(item => item.materialId)
    const materials = await prisma.material.findMany({
      where: {
        id: { in: materialIds },
        companyId: companyId
      },
      select: { id: true }
    })
    
    if (materials.length !== materialIds.length) {
      return c.json({ 
        success: false, 
        error: 'One or more materials are invalid' 
      }, 400)
    }
    
    // Create requisition with items
    const requisition = await prisma.requisition.create({
      data: {
        factoryId: validated.factoryId,
        requisitionNo,
        requisitionDate: new Date(),
        department: validated.department,
        priority: validated.priority,
        purpose: validated.purpose,
        status: 'DRAFT',
        requestedBy: userId,
        remarks: validated.remarks,
        items: {
          create: validated.items.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            requiredDate: new Date(item.requiredDate),
            specification: item.specification,
            remarks: item.remarks
          }))
        }
      },
      include: {
        factory: {
          select: { name: true, code: true }
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
    
    return c.json({ success: true, requisition })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update requisition
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
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
    
    // Check if requisition exists and is in draft status
    const existing = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        }
      }
    })
    
    if (!existing) {
      return c.json({ success: false, error: 'Requisition not found' }, 404)
    }
    
    if (existing.status !== 'DRAFT') {
      return c.json({ 
        success: false, 
        error: 'Cannot update requisition that is not in draft status' 
      }, 400)
    }
    
    // Update requisition and items
    const requisition = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.requisitionItem.deleteMany({
        where: { requisitionId }
      })
      
      // Update requisition
      return await tx.requisition.update({
        where: { id: requisitionId },
        data: {
          department: body.department || existing.department,
          priority: body.priority || existing.priority,
          purpose: body.purpose,
          remarks: body.remarks,
          items: {
            create: body.items?.map((item: any) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              requiredDate: new Date(item.requiredDate),
              specification: item.specification,
              remarks: item.remarks
            })) || []
          }
        },
        include: {
          factory: {
            select: { name: true, code: true }
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
    })
    
    return c.json({ success: true, requisition })
  } catch (error: any) {
    console.error('Error updating requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Submit requisition for approval
app.post('/:id/submit', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
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
    
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        },
        status: 'DRAFT'
      },
      include: {
        items: true
      }
    })
    
    if (!requisition) {
      return c.json({ 
        success: false, 
        error: 'Requisition not found or not in draft status' 
      }, 404)
    }
    
    if (requisition.items.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot submit requisition without items' 
      }, 400)
    }
    
    // Update status to submitted
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { 
        status: 'SUBMITTED'
      },
      include: {
        factory: {
          select: { name: true, code: true }
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
    
    return c.json({ success: true, requisition: updated })
  } catch (error: any) {
    console.error('Error submitting requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Approve requisition
app.post('/:id/approve', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const { remarks } = body
    
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
    
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        },
        status: 'SUBMITTED'
      }
    })
    
    if (!requisition) {
      return c.json({ 
        success: false, 
        error: 'Requisition not found or not in submitted status' 
      }, 404)
    }
    
    // Update status to approved
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { 
        status: 'APPROVED',
        approvedBy: userId,
        approvedDate: new Date(),
        remarks: remarks || requisition.remarks
      },
      include: {
        factory: {
          select: { name: true, code: true }
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
    
    return c.json({ success: true, requisition: updated })
  } catch (error: any) {
    console.error('Error approving requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Reject requisition
app.post('/:id/reject', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const { reason } = body
    
    if (!reason) {
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
    
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        },
        status: 'SUBMITTED'
      }
    })
    
    if (!requisition) {
      return c.json({ 
        success: false, 
        error: 'Requisition not found or not in submitted status' 
      }, 404)
    }
    
    // Update status to cancelled with rejection reason
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { 
        status: 'CANCELLED',
        remarks: `Rejected: ${reason}`
      },
      include: {
        factory: {
          select: { name: true, code: true }
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
    
    return c.json({ success: true, requisition: updated })
  } catch (error: any) {
    console.error('Error rejecting requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete requisition (only draft)
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const requisitionId = c.req.param('id')
  
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
    
    const requisition = await prisma.requisition.findFirst({
      where: {
        id: requisitionId,
        factory: {
          companyId: companyId
        },
        status: 'DRAFT'
      }
    })
    
    if (!requisition) {
      return c.json({ 
        success: false, 
        error: 'Requisition not found or cannot be deleted' 
      }, 404)
    }
    
    await prisma.requisition.delete({
      where: { id: requisitionId }
    })
    
    return c.json({ success: true, message: 'Requisition deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting requisition:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app