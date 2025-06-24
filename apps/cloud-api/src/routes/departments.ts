import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Department schema
const departmentSchema = z.object({
  divisionId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  isActive: z.boolean().optional()
})

// Get all departments
app.get('/', async (c) => {
  const divisionId = c.req.query('divisionId')
  const isActive = c.req.query('isActive')
  
  try {
    const where: any = {}
    if (divisionId) where.divisionId = divisionId
    if (isActive !== undefined) where.isActive = isActive === 'true'
    
    const departments = await prisma.department.findMany({
      where,
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return c.json({ departments })
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get department by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    if (!department) {
      return c.json({ error: 'Department not found' }, 404)
    }
    
    return c.json({ department })
  } catch (error: any) {
    console.error('Error fetching department:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create new department
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = departmentSchema.parse(body)
    
    // Check if department code already exists in the division
    const existing = await prisma.department.findFirst({
      where: {
        divisionId: validated.divisionId,
        code: validated.code
      }
    })
    
    if (existing) {
      return c.json({ 
        error: 'Department code already exists in this division' 
      }, 400)
    }
    
    const department = await prisma.department.create({
      data: validated,
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })
    
    return c.json({ department })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating department:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Update department
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const validated = departmentSchema.partial().parse(body)
    
    // If code is being updated, check if it already exists
    if (validated.code) {
      const existing = await prisma.department.findFirst({
        where: {
          divisionId: validated.divisionId,
          code: validated.code,
          id: { not: id }
        }
      })
      
      if (existing) {
        return c.json({ 
          error: 'Department code already exists in this division' 
        }, 400)
      }
    }
    
    const department = await prisma.department.update({
      where: { id },
      data: validated,
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })
    
    return c.json({ department })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error updating department:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Delete department
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.department.delete({
      where: { id }
    })
    
    return c.json({ message: 'Department deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting department:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create default departments for all divisions
app.post('/create-defaults', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true, role: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ 
        error: 'User is not associated with a company' 
      }, 400)
    }
    
    // Check if user is admin
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ 
        error: 'Only admin or owner can create default departments' 
      }, 403)
    }
    
    // Get all divisions for the company
    const divisions = await prisma.division.findMany({
      where: { companyId }
    })
    
    if (divisions.length === 0) {
      return c.json({ 
        error: 'No divisions found. Please create divisions first.' 
      }, 400)
    }
    
    // Default departments for each division type
    const departmentTemplates = {
      SUGAR: [
        { code: 'PROD', name: 'Production', description: 'Sugar production and processing' },
        { code: 'MAINT', name: 'Maintenance', description: 'Mechanical and electrical maintenance' },
        { code: 'LAB', name: 'Laboratory', description: 'Quality control and testing' },
        { code: 'CANEPAY', name: 'Cane Payment', description: 'Farmer payments and cane accounting' },
        { code: 'STORE', name: 'Stores', description: 'Inventory and spare parts management' },
        { code: 'ADMIN', name: 'Administration', description: 'HR, Finance, and general administration' },
        { code: 'CANEDEV', name: 'Cane Development', description: 'Agricultural extension and farmer support' }
      ],
      ETHANOL: [
        { code: 'DIST', name: 'Distillation', description: 'Ethanol production and distillation' },
        { code: 'FERM', name: 'Fermentation', description: 'Fermentation process management' },
        { code: 'MAINT', name: 'Maintenance', description: 'Equipment maintenance' },
        { code: 'LAB', name: 'Laboratory', description: 'Quality control and analysis' },
        { code: 'STORE', name: 'Stores', description: 'Raw materials and chemicals' },
        { code: 'ADMIN', name: 'Administration', description: 'Administrative functions' }
      ],
      POWER: [
        { code: 'GEN', name: 'Generation', description: 'Power generation operations' },
        { code: 'BOILER', name: 'Boiler', description: 'Boiler operations and maintenance' },
        { code: 'TURB', name: 'Turbine', description: 'Turbine operations' },
        { code: 'ELEC', name: 'Electrical', description: 'Electrical maintenance and grid' },
        { code: 'INST', name: 'Instrumentation', description: 'Control and instrumentation' },
        { code: 'ADMIN', name: 'Administration', description: 'Administrative functions' }
      ],
      FEED: [
        { code: 'PROD', name: 'Production', description: 'Feed production and packaging' },
        { code: 'QC', name: 'Quality Control', description: 'Feed quality and testing' },
        { code: 'MAINT', name: 'Maintenance', description: 'Equipment maintenance' },
        { code: 'STORE', name: 'Stores', description: 'Raw materials and finished goods' },
        { code: 'ADMIN', name: 'Administration', description: 'Administrative functions' }
      ],
      COMMON: [
        { code: 'WEIGH', name: 'Weighbridge', description: 'Vehicle weighment operations' },
        { code: 'SECURITY', name: 'Security', description: 'Factory security and access control' },
        { code: 'IT', name: 'IT', description: 'Information technology and systems' },
        { code: 'HR', name: 'Human Resources', description: 'HR and personnel management' },
        { code: 'FINANCE', name: 'Finance', description: 'Accounting and financial management' },
        { code: 'PURCHASE', name: 'Purchase', description: 'Procurement and vendor management' },
        { code: 'CIVIL', name: 'Civil', description: 'Civil works and infrastructure' }
      ]
    }
    
    const createdDepartments = []
    
    // Create departments for each division
    for (const division of divisions) {
      const templates = departmentTemplates[division.code as keyof typeof departmentTemplates] || departmentTemplates.COMMON
      
      for (const template of templates) {
        // Check if department already exists
        const existing = await prisma.department.findFirst({
          where: {
            divisionId: division.id,
            code: template.code
          }
        })
        
        if (!existing) {
          const department = await prisma.department.create({
            data: {
              divisionId: division.id,
              ...template
            }
          })
          createdDepartments.push(department)
        }
      }
    }
    
    return c.json({ 
      message: `Created ${createdDepartments.length} departments`,
      departments: createdDepartments 
    })
  } catch (error: any) {
    console.error('Error creating default departments:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app