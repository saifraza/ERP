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
    
    // Delete in correct order to avoid foreign key constraints
    console.log('Starting deletion process...')
    
    // Delete all procurement-related tables first
    await prisma.purchaseRequisitionItem.deleteMany({})
    await prisma.purchaseRequisition.deleteMany({})
    await prisma.requisitionItem.deleteMany({})
    await prisma.requisition.deleteMany({})
    
    // Delete department and divisions
    await prisma.department.deleteMany({})
    await prisma.division.deleteMany({})
    
    // Delete company-related tables
    await prisma.companyUser.deleteMany({})
    await prisma.emailCredential.deleteMany({})
    await prisma.factory.deleteMany({})
    
    // Finally delete companies
    const deleted = await prisma.company.deleteMany({})
    
    console.log(`Deleted ${deleted.count} companies`)
    
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