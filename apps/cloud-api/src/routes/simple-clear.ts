import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Simple clear company data
app.post('/company', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user?.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403)
    }
    
    // Just delete companies - CASCADE will handle the rest
    const deleted = await prisma.company.deleteMany({})
    
    return c.json({ 
      message: 'Companies deleted successfully',
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Clear company error:', error)
    return c.json({ 
      error: 'Failed to clear companies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app