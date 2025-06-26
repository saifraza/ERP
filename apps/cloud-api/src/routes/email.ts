import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { getGmailService } from '../services/gmail.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

const app = new Hono()

// Protect all email routes
app.use('*', authMiddleware)

// Get full email content
app.get('/message/:messageId', async (c) => {
  try {
    const messageId = c.req.param('messageId')
    const companyId = c.req.query('companyId')
    
    if (!messageId) {
      return c.json({
        success: false,
        error: 'Message ID is required'
      }, 400)
    }
    
    // Get the appropriate Gmail service
    let gmail
    
    if (companyId) {
      const { client } = await multiTenantGmail.getClient(companyId)
      const { google } = await import('googleapis')
      gmail = google.gmail({ version: 'v1', auth: client })
    } else {
      const gmailService = getGmailService()
      gmail = gmailService.gmail
    }
    
    // Fetch full message
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    })
    
    const message = response.data
    
    // Extract message parts
    const payload = message.payload
    const headers = payload?.headers || []
    
    // Get header values
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    
    // Extract body
    let textBody = ''
    let htmlBody = ''
    
    const extractBody = (parts: any[]): void => {
      for (const part of parts || []) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.parts) {
          extractBody(part.parts)
        }
      }
    }
    
    // Handle single part messages
    if (payload?.body?.data) {
      if (payload.mimeType === 'text/plain') {
        textBody = Buffer.from(payload.body.data, 'base64').toString('utf-8')
      } else if (payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(payload.body.data, 'base64').toString('utf-8')
      }
    }
    
    // Handle multipart messages
    if (payload?.parts) {
      extractBody(payload.parts)
    }
    
    return c.json({
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        snippet: message.snippet,
        textBody: textBody || 'No text content',
        htmlBody: htmlBody,
        hasAttachments: message.payload?.parts?.some((p: any) => p.filename) || false
      }
    })
    
  } catch (error: any) {
    console.error('Failed to fetch email message:', error)
    return c.json({
      success: false,
      error: error?.message || 'Failed to fetch email content'
    }, 500)
  }
})

// Get email content by ID for RFQ email details
app.get('/content/:emailId', async (c) => {
  const userId = c.get('userId')
  const emailId = c.req.param('emailId')
  
  try {
    // Get user's company
    const { prisma } = await import('../lib/prisma.js')
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Fetch full email content from Gmail
    const emailContent = await multiTenantGmail.getEmailContent(companyUser.companyId, emailId)
    
    return c.json(emailContent)
  } catch (error: any) {
    console.error('Error fetching email content:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Download email attachment
app.get('/attachment/:emailId/:attachmentId', async (c) => {
  const userId = c.get('userId')
  const emailId = c.req.param('emailId')
  const attachmentId = c.req.param('attachmentId')
  
  try {
    // Get user's company
    const { prisma } = await import('../lib/prisma.js')
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Get attachment from Gmail
    const attachment = await multiTenantGmail.getAttachment(companyUser.companyId, emailId, attachmentId)
    
    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404)
    }
    
    // Decode base64 data
    const buffer = Buffer.from(attachment.data, 'base64')
    
    // Set appropriate headers
    c.header('Content-Type', attachment.mimeType || 'application/octet-stream')
    c.header('Content-Disposition', `attachment; filename="${attachment.filename || 'attachment'}"`)
    c.header('Content-Length', buffer.length.toString())
    
    return c.body(buffer)
  } catch (error: any) {
    console.error('Error fetching attachment:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app