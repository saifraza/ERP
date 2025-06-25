import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { rfqEmailProcessor } from '../services/rfq-email-processor.js'

const app = new Hono()

// Process RFQ emails for the company
app.post('/process', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true, role: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Process emails
    const result = await rfqEmailProcessor.processRFQEmails(companyUser.companyId)
    
    return c.json(result)
  } catch (error: any) {
    console.error('Error processing RFQ emails:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Send RFQ reminders
app.post('/send-reminders', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true, role: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Only admins can send reminders
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ error: 'Admin role required' }, 403)
    }
    
    // Send reminders
    const result = await rfqEmailProcessor.sendRFQReminders(companyUser.companyId)
    
    return c.json(result)
  } catch (error: any) {
    console.error('Error sending reminders:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get pending email responses
app.get('/pending-responses', authMiddleware, async (c) => {
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
    
    // Get pending responses
    const pendingResponses = await prisma.rFQEmailResponse.findMany({
      where: {
        rfq: {
          companyId: companyUser.companyId
        },
        processingStatus: 'pending_review'
      },
      include: {
        rfq: {
          select: {
            rfqNumber: true
          }
        },
        vendor: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { receivedAt: 'desc' }
    })
    
    return c.json({
      success: true,
      count: pendingResponses.length,
      responses: pendingResponses
    })
  } catch (error: any) {
    console.error('Error fetching pending responses:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get RFQ communication analytics
app.get('/analytics', authMiddleware, async (c) => {
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
    
    // Get analytics
    const [
      activeRFQs,
      totalEmailsSent,
      totalResponsesReceived,
      avgResponseTime,
      vendorResponseRates
    ] = await Promise.all([
      // Active RFQs
      prisma.rFQ.count({
        where: {
          companyId: companyUser.companyId,
          status: { in: ['OPEN', 'sent'] }
        }
      }),
      
      // Total emails sent
      prisma.rFQEmailLog.count({
        where: {
          rfq: {
            companyId: companyUser.companyId
          }
        }
      }),
      
      // Total responses received
      prisma.rFQEmailResponse.count({
        where: {
          rfq: {
            companyId: companyUser.companyId
          }
        }
      }),
      
      // Average response time
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (er."receivedAt" - el."sentAt"))/3600) as avg_hours
        FROM "RFQEmailResponse" er
        JOIN "RFQEmailLog" el ON er."rfqId" = el."rfqId" AND er."vendorId" = el."vendorId"
        JOIN "RFQ" r ON er."rfqId" = r.id
        WHERE r."companyId" = ${companyUser.companyId}
        AND el."emailType" = 'rfq_sent'
      `,
      
      // Vendor response rates
      prisma.$queryRaw`
        SELECT 
          v.name as vendor_name,
          v.id as vendor_id,
          COUNT(DISTINCT rv."rfqId") as total_rfqs,
          COUNT(DISTINCT CASE WHEN rv."responseReceived" THEN rv."rfqId" END) as responses_received,
          CAST(COUNT(DISTINCT CASE WHEN rv."responseReceived" THEN rv."rfqId" END) AS FLOAT) / 
          NULLIF(COUNT(DISTINCT rv."rfqId"), 0) * 100 as response_rate
        FROM "Vendor" v
        JOIN "RFQVendor" rv ON v.id = rv."vendorId"
        JOIN "RFQ" r ON rv."rfqId" = r.id
        WHERE r."companyId" = ${companyUser.companyId}
        GROUP BY v.id, v.name
        ORDER BY response_rate DESC
        LIMIT 10
      `
    ])
    
    return c.json({
      success: true,
      analytics: {
        activeRFQs,
        totalEmailsSent,
        totalResponsesReceived,
        avgResponseTimeHours: avgResponseTime[0]?.avg_hours || 0,
        vendorResponseRates
      }
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app