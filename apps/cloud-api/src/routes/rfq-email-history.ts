import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Get all RFQs with email statistics
app.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Fetch all RFQs with vendor email information
    const rfqs = await prisma.rFQ.findMany({
      where: {
        companyId: companyUser.companyId,
      },
      include: {
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                code: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return c.json({ 
      rfqs: rfqs.map(rfq => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        status: rfq.status,
        issueDate: rfq.issueDate,
        submissionDeadline: rfq.submissionDeadline,
        vendors: rfq.vendors,
        quotationCount: 0
      }))
    })
  } catch (error) {
    console.error('Error fetching RFQs:', error)
    return c.json({ error: 'Failed to fetch RFQs' }, 500)
  }
})

// Get email history for a specific RFQ
app.get('/:rfqId/logs', authMiddleware, async (c) => {
  try {
    const rfqId = c.req.param('rfqId')
    const userId = c.get('userId')
    
    // For now, return mock data since the email log tables don't exist yet
    // TODO: Uncomment when tables are created
    /*
    const emailLogs = await prisma.rFQEmailLog.findMany({
      where: {
        rfqId,
        rfq: {
          companyId: user.companyId
        }
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    })
    */
    
    // Mock data for now
    const emailLogs = []
    
    return c.json({ emailLogs })
  } catch (error) {
    console.error('Error fetching email logs:', error)
    return c.json({ error: 'Failed to fetch email logs' }, 500)
  }
})

// Process RFQ emails
app.post('/process', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // TODO: Implement email processing logic
    // For now, return a success message
    
    return c.json({ 
      processed: 0,
      message: 'Email processing feature coming soon'
    })
  } catch (error) {
    console.error('Error processing emails:', error)
    return c.json({ error: 'Failed to process emails' }, 500)
  }
})

export default app