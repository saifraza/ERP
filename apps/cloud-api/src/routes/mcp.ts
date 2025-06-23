import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { getGmailService } from '../services/gmail.js'

const app = new Hono()

// Protect all MCP routes
app.use('*', authMiddleware)

// MCP Server endpoint (using Railway internal URL when available)
const getMCPUrl = () => {
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    return 'http://mcp-server.railway.internal:3000'
  }
  return process.env.MCP_SERVER_URL || 'https://mcp-server-production-ac21.up.railway.app'
}

// Gmail API endpoints - Direct integration for robust ERP
app.post('/gmail/:action', async (c) => {
  try {
    const action = c.req.param('action')
    const body = await c.req.json()
    
    // Initialize Gmail service with OAuth
    let gmailService
    try {
      gmailService = getGmailService()
    } catch (error: any) {
      console.error('Gmail service initialization error:', error)
      return c.json({
        success: false,
        error: 'Gmail service not configured. Please check OAuth credentials.',
        details: error?.message || 'Unknown error',
        hint: 'Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to environment variables'
      }, 500)
    }
    
    // Handle different Gmail actions
    switch (action) {
      case 'list-emails': {
        const { maxResults = 20, query = '' } = body
        const emails = await gmailService.listEmails(maxResults, query)
        return c.json({
          success: true,
          data: emails,
          count: emails.length
        })
      }
      
      case 'send-email': {
        const { to, subject, body: emailBody, cc, bcc } = body
        if (!to || !subject || !emailBody) {
          return c.json({
            success: false,
            error: 'Missing required fields: to, subject, body'
          }, 400)
        }
        
        const result = await gmailService.sendEmail(to, subject, emailBody, cc, bcc)
        return c.json(result)
      }
      
      case 'list-events': {
        const { maxResults = 10 } = body
        const events = await gmailService.listCalendarEvents(maxResults)
        return c.json({
          success: true,
          data: events,
          count: events.length
        })
      }
      
      case 'search-suppliers': {
        const emails = await gmailService.searchSupplierEmails()
        return c.json({
          success: true,
          data: emails,
          count: emails.length,
          message: 'Found supplier emails with potential documents'
        })
      }
      
      case 'extract-attachments': {
        const { messageId } = body
        if (!messageId) {
          return c.json({
            success: false,
            error: 'Message ID required'
          }, 400)
        }
        
        const attachments = await gmailService.extractAttachments(messageId)
        return c.json({
          success: true,
          data: attachments,
          count: attachments.length
        })
      }
      
      default:
        return c.json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: [
            'list-emails',
            'send-email',
            'list-events',
            'search-suppliers',
            'extract-attachments'
          ]
        }, 400)
    }
    
  } catch (error: any) {
    console.error('MCP proxy error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process MCP request',
      details: error?.stack || error?.toString() || 'Unknown error'
    }, 500)
  }
})

// Health check for MCP integration
app.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    mcp_server: getMCPUrl(),
    integration: 'Gmail & Calendar',
    features: [
      'Email listing and search',
      'Email sending',
      'Calendar events',
      'Document analysis',
      'Attachment extraction'
    ]
  })
})

export default app