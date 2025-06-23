import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { getGmailService } from '../services/gmail.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

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

// Multi-tenant Gmail endpoints
app.post('/company/:companyId/gmail/:action', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const action = c.req.param('action')
    const body = await c.req.json()
    
    switch (action) {
      case 'list-emails': {
        const { maxResults = 20, query = '' } = body
        const emails = await multiTenantGmail.listEmails(companyId, maxResults, query)
        return c.json({
          success: true,
          data: emails,
          count: emails.length,
          company: companyId
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
        
        const result = await multiTenantGmail.sendEmail(
          companyId,
          to,
          subject,
          emailBody,
          cc,
          bcc
        )
        return c.json(result)
      }
      
      default:
        return c.json({
          success: false,
          error: `Unknown action: ${action}`
        }, 400)
    }
  } catch (error: any) {
    console.error('Multi-tenant Gmail error:', error)
    return c.json({
      success: false,
      error: error?.message || 'Failed to process request'
    }, 500)
  }
})

// Gmail API endpoints - Direct integration for robust ERP (Legacy/Default)
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
      
      case 'list-message-ids': {
        // Simple endpoint that just returns message IDs
        const { maxResults = 20, query = '' } = body
        try {
          const response = await gmailService.gmail.users.messages.list({
            userId: 'me',
            maxResults,
            q: query || ''
          })
          
          return c.json({
            success: true,
            data: response.data.messages || [],
            resultSizeEstimate: response.data.resultSizeEstimate,
            nextPageToken: response.data.nextPageToken
          })
        } catch (error: any) {
          return c.json({
            success: false,
            error: error?.message || 'Failed to list message IDs'
          }, 500)
        }
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
            'list-message-ids',
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
  let gmailStatus = 'not_initialized'
  let gmailError = null
  let gmailDetails = null
  
  try {
    const gmailService = getGmailService()
    // Try to get user profile to test connection
    const testResponse = await gmailService.gmail.users.getProfile({ userId: 'me' })
    gmailStatus = 'connected'
    gmailDetails = {
      email: testResponse.data.emailAddress,
      messagesTotal: testResponse.data.messagesTotal,
      threadsTotal: testResponse.data.threadsTotal
    }
    console.log('Gmail profile test successful:', testResponse.data.emailAddress)
  } catch (error: any) {
    gmailStatus = 'error'
    gmailError = error?.message || 'Unknown error'
    console.error('Gmail health check error:', {
      message: error?.message,
      code: error?.code,
      errors: error?.errors,
      response: error?.response?.data
    })
  }
  
  return c.json({
    status: 'ok',
    mcp_server: getMCPUrl(),
    integration: 'Gmail & Calendar',
    gmail_status: gmailStatus,
    gmail_error: gmailError,
    gmail_details: gmailDetails,
    oauth_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN),
    features: [
      'Email listing and search',
      'Email sending',
      'Calendar events',
      'Document analysis',
      'Attachment extraction'
    ]
  })
})

// Check OAuth scopes
app.get('/check-scopes', authMiddleware, async (c) => {
  try {
    const gmailService = getGmailService()
    
    // Get access token
    const tokenInfo = await gmailService.oauth2Client.getAccessToken()
    
    if (!tokenInfo.token) {
      return c.json({ error: 'No access token available' }, 500)
    }
    
    // Make a request to tokeninfo endpoint
    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenInfo.token}`)
    const tokenData = await tokenInfoResponse.json()
    
    return c.json({
      email: tokenData.email,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
      expires_in: tokenData.expires_in,
      token_type: 'Bearer'
    })
  } catch (error: any) {
    return c.json({
      error: 'Failed to check scopes',
      details: error?.message
    }, 500)
  }
})

// OAuth test endpoint for debugging
app.get('/oauth-test', authMiddleware, async (c) => {
  try {
    const gmailService = getGmailService()
    
    // Test 1: Get access token
    const tokenInfo = await gmailService.oauth2Client.getAccessToken()
    
    // Test 2: Get user profile
    let profileTest = null
    try {
      const profile = await gmailService.gmail.users.getProfile({ userId: 'me' })
      profileTest = {
        success: true,
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal
      }
    } catch (error: any) {
      profileTest = {
        success: false,
        error: error?.message,
        code: error?.code
      }
    }
    
    // Test 3: List labels (simple permission test)
    let labelsTest = null
    try {
      const labels = await gmailService.gmail.users.labels.list({ userId: 'me' })
      labelsTest = {
        success: true,
        count: labels.data.labels?.length || 0
      }
    } catch (error: any) {
      labelsTest = {
        success: false,
        error: error?.message,
        code: error?.code
      }
    }
    
    // Test 4: Try to list one message
    let messageTest = null
    try {
      const messages = await gmailService.gmail.users.messages.list({
        userId: 'me',
        maxResults: 1
      })
      messageTest = {
        success: true,
        hasMessages: (messages.data.messages?.length || 0) > 0
      }
    } catch (error: any) {
      messageTest = {
        success: false,
        error: error?.message,
        code: error?.code,
        details: error?.response?.data
      }
    }
    
    return c.json({
      oauth_status: 'testing',
      token: {
        hasToken: !!tokenInfo.token,
        type: tokenInfo.res?.data?.token_type,
        expiresIn: tokenInfo.res?.data?.expires_in
      },
      tests: {
        profile: profileTest,
        labels: labelsTest,
        messages: messageTest
      }
    })
  } catch (error: any) {
    return c.json({
      oauth_status: 'error',
      error: error?.message || 'OAuth test failed',
      details: error?.stack
    }, 500)
  }
})

export default app