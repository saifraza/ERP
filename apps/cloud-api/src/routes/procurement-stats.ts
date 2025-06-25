import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Get actual counts for debugging
app.get('/counts', async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const companyId = companyUser.companyId
    
    // Get actual counts
    const counts = {
      requisitions: await prisma.requisition.count({
        where: { factory: { companyId } }
      }),
      requisitionsByStatus: await prisma.requisition.groupBy({
        by: ['status'],
        where: { factory: { companyId } },
        _count: true
      }),
      vendors: await prisma.vendor.count({
        where: { companyId }
      }),
      activeVendors: await prisma.vendor.count({
        where: { companyId, isActive: true }
      }),
      materials: await prisma.material.count({
        where: { companyId }
      }),
      factories: await prisma.factory.count({
        where: { companyId }
      }),
      divisions: await prisma.division.count({
        where: { companyId }
      }),
      departments: await prisma.department.count({
        where: { divisionId: { in: await prisma.division.findMany({
          where: { companyId },
          select: { id: true }
        }).then(divs => divs.map(d => d.id)) } }
      })
    }
    
    return c.json(counts)
  } catch (error: any) {
    console.error('Error fetching counts:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app