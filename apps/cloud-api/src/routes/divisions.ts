import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Division schema
const divisionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10)
})

// Get all divisions for a company
app.get('/', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: userId },
      select: { companyId: true }
    })
    
    const companyId = companyUser?.companyId
    
    if (!companyId) {
      return c.json({ success: true, divisions: [] })
    }
    
    const divisions = await prisma.division.findMany({
      where: { companyId: companyId },
      orderBy: { name: 'asc' }
    })
    
    return c.json({ success: true, divisions })
  } catch (error: any) {
    console.error('Error fetching divisions:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new division
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
    const validated = divisionSchema.parse(body)
    
    // Check if division code already exists
    const existing = await prisma.division.findFirst({
      where: {
        companyId: companyId,
        code: validated.code
      }
    })
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Division code already exists' 
      }, 400)
    }
    
    const division = await prisma.division.create({
      data: {
        ...validated,
        companyId: companyId
      }
    })
    
    return c.json({ success: true, division })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    console.error('Error creating division:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app