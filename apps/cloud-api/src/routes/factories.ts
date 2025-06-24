import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Get factories for user's company
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
      return c.json({ success: true, factories: [] })
    }
    
    const factories = await prisma.factory.findMany({
      where: {
        companyId: companyId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        city: true,
        state: true,
        crushingCapacity: true,
        powerCapacity: true,
        ethanolCapacity: true,
        feedCapacity: true
      },
      orderBy: { name: 'asc' }
    })
    
    return c.json({ success: true, factories })
  } catch (error: any) {
    console.error('Error fetching factories:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app