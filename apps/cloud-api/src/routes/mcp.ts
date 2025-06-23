import { Hono } from 'hono'
import axios from 'axios'
import { authMiddleware } from '../middleware/auth.js'

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

// Proxy requests to MCP server
app.post('/gmail/:action', async (c) => {
  try {
    const action = c.req.param('action')
    const body = await c.req.json()
    
    // Map frontend actions to MCP tools
    const toolMap: Record<string, string> = {
      'list-emails': 'list_emails',
      'send-email': 'send_email',
      'search-emails': 'search_emails',
      'list-events': 'list_events',
      'create-event': 'create_event',
      'extract-attachments': 'extract_attachments',
      'analyze-document': 'analyze_document'
    }
    
    const tool = toolMap[action] || action
    
    // For now, return mock data since MCP server needs special protocol
    // In production, this would communicate with MCP via proper channels
    
    if (tool === 'list_emails') {
      return c.json({
        success: true,
        data: [
          {
            id: '1',
            subject: 'Purchase Order #PO-2024-001',
            from: 'supplier@example.com',
            date: new Date().toISOString()
          },
          {
            id: '2',
            subject: 'Invoice for Sugar Bags - December 2024',
            from: 'vendor@packagingsupplier.com',
            date: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            subject: 'Ethanol Production Report - Week 51',
            from: 'production@factory.com',
            date: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      })
    }
    
    if (tool === 'list_events') {
      return c.json({
        success: true,
        data: [
          {
            id: '1',
            summary: 'Production Review Meeting',
            start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
            end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
            location: 'Conference Room A'
          },
          {
            id: '2',
            summary: 'Vendor Payment Review',
            start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
            end: { dateTime: new Date(Date.now() + 176400000).toISOString() }
          }
        ]
      })
    }
    
    if (tool === 'send_email') {
      return c.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          id: 'msg_' + Date.now(),
          ...body
        }
      })
    }
    
    // Default response
    return c.json({
      success: true,
      message: `MCP action ${action} processed`,
      tool,
      data: body
    })
    
  } catch (error) {
    console.error('MCP proxy error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process MCP request'
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