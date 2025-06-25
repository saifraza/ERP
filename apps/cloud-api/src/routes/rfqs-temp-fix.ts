import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Temporary fix for RFQ detail endpoint
app.get('/:id/safe', async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      include: {
        requisition: {
          include: {
            division: true,
            items: true
          }
        },
        vendors: {
          include: {
            vendor: true
          }
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
        quotations: {
          include: {
            vendor: true,
            items: true
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ success: false, error: 'RFQ not found' }, 404)
    }
    
    return c.json({ success: true, rfq })
  } catch (error: any) {
    console.error('Error fetching RFQ:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app