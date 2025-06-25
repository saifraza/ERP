import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Admin endpoint to reset RFQ status (for testing/debugging)
app.post('/:id/reset-status', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const rfqId = c.req.param('id')
  
  try {
    // Get user's company and check admin role
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true, role: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ error: 'Admin role required' }, 403)
    }
    
    // Reset RFQ status to OPEN
    const rfq = await prisma.rFQ.update({
      where: { 
        id: rfqId,
        companyId: companyUser.companyId
      },
      data: { 
        status: 'OPEN' 
      },
      select: {
        id: true,
        rfqNumber: true,
        status: true
      }
    })
    
    return c.json({
      success: true,
      message: 'RFQ status reset to OPEN',
      rfq
    })
  } catch (error: any) {
    console.error('Error resetting RFQ status:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get email history for an RFQ
app.get('/:id/email-history', authMiddleware, async (c) => {
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
    
    // Get RFQ with vendor email status
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: rfqId,
        companyId: companyUser.companyId
      },
      include: {
        vendors: {
          include: {
            vendor: {
              select: {
                name: true,
                email: true,
                code: true
              }
            }
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ error: 'RFQ not found' }, 404)
    }
    
    // Format email history
    const emailHistory = rfq.vendors.map(v => ({
      vendorName: v.vendor.name,
      vendorEmail: v.vendor.email,
      vendorCode: v.vendor.code,
      emailSent: v.emailSent,
      emailSentAt: v.emailSentAt,
      responseReceived: v.responseReceived,
      status: v.emailSent ? 
        (v.responseReceived ? 'Response Received' : 'Sent - Awaiting Response') : 
        'Not Sent'
    }))
    
    return c.json({
      success: true,
      rfqNumber: rfq.rfqNumber,
      rfqStatus: rfq.status,
      totalVendors: rfq.vendors.length,
      emailsSent: rfq.vendors.filter(v => v.emailSent).length,
      responsesReceived: rfq.vendors.filter(v => v.responseReceived).length,
      emailHistory
    })
  } catch (error: any) {
    console.error('Error fetching email history:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app