import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

app.use('*', authMiddleware)

// Debug endpoint to check email setup
app.get('/check', async (c) => {
  try {
    const userId = c.get('userId')
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        linkedGmailEmail: true,
        name: true
      }
    })
    
    // Get email credentials
    const credentials = await prisma.emailCredential.findMany({
      where: { userId },
      select: {
        id: true,
        emailAddress: true,
        provider: true,
        isActive: true,
        lastSynced: true,
        createdAt: true
      }
    })
    
    // Get company info
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      include: {
        company: true
      }
    })
    
    return c.json({
      user: {
        id: user?.id,
        email: user?.email,
        linkedGmailEmail: user?.linkedGmailEmail,
        name: user?.name
      },
      emailCredentials: credentials,
      company: companyUser?.company,
      status: {
        hasLinkedEmail: !!user?.linkedGmailEmail,
        hasCredentials: credentials.length > 0,
        isReady: !!user?.linkedGmailEmail && credentials.length > 0
      }
    })
  } catch (error) {
    console.error('Debug email check error:', error)
    return c.json({ error: 'Failed to check email status' }, 500)
  }
})

// Test email connection
app.get('/test-connection', async (c) => {
  try {
    const userId = c.get('userId')
    
    // Try to list emails
    const { multiTenantGmail } = await import('../services/multi-tenant-gmail.js')
    
    try {
      const emails = await multiTenantGmail.listEmails(userId, 1)
      return c.json({
        success: true,
        message: 'Email connection is working',
        emailCount: emails.length,
        firstEmail: emails[0] ? {
          subject: emails[0].subject,
          from: emails[0].from,
          date: emails[0].date
        } : null
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: 'Email connection failed',
        details: error.message,
        userId: userId
      }, 500)
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return c.json({ error: 'Failed to test connection' }, 500)
  }
})

export default app