import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

const app = new Hono()

// Protect all assistant routes
app.use('*', authMiddleware)

// Simple AI assistant endpoint
app.post('/chat', async (c) => {
  try {
    const { message, companyId } = await c.req.json()
    
    if (!message) {
      return c.json({
        success: false,
        error: 'Message is required'
      }, 400)
    }
    
    // Simple pattern matching for email-related queries
    const lowerMessage = message.toLowerCase()
    
    // Handle different types of queries
    if (lowerMessage.includes('email') && (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('fetch'))) {
      // Fetch emails
      try {
        const emails = await multiTenantGmail.listEmails(companyId, 10)
        return c.json({
          success: true,
          response: `I found ${emails.length} recent emails. The most recent ones are:\n\n${emails.slice(0, 3).map(e => `• ${e.subject} - from ${e.from}`).join('\n')}`,
          data: emails
        })
      } catch (error) {
        return c.json({
          success: true,
          response: "I couldn't fetch emails at the moment. Please make sure your email account is connected in Settings."
        })
      }
    }
    
    if (lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('meeting')) {
      // Fetch calendar events
      try {
        const events = await multiTenantGmail.listCalendarEvents(companyId, 10)
        return c.json({
          success: true,
          response: `I found ${events.length} upcoming events:\n\n${events.slice(0, 3).map(e => `• ${e.summary} - ${new Date(e.start.dateTime || e.start.date).toLocaleString()}`).join('\n')}`,
          data: events
        })
      } catch (error) {
        return c.json({
          success: true,
          response: "I couldn't fetch calendar events. Please make sure your calendar permissions are enabled."
        })
      }
    }
    
    if (lowerMessage.includes('invoice') || lowerMessage.includes('purchase order') || lowerMessage.includes('supplier')) {
      return c.json({
        success: true,
        response: "I can help you search for invoices and purchase orders. Try asking me to 'find invoices from last month' or 'show purchase orders from supplier X'."
      })
    }
    
    if (lowerMessage.includes('send') && lowerMessage.includes('email')) {
      return c.json({
        success: true,
        response: "I can help you draft emails. Please provide the recipient, subject, and what you'd like to say. For example: 'Send an email to supplier@example.com about delayed shipment'."
      })
    }
    
    if (lowerMessage.includes('help')) {
      return c.json({
        success: true,
        response: "I can help you with:\n• Listing and searching emails\n• Viewing calendar events\n• Finding invoices and purchase orders\n• Drafting email responses\n• Analyzing email attachments\n\nJust ask me what you need!"
      })
    }
    
    // Default response
    return c.json({
      success: true,
      response: "I understand you're asking about: \"" + message + "\". I can help you manage emails, view calendar events, and analyze documents. Try asking me to 'show recent emails' or 'list calendar events'."
    })
    
  } catch (error: any) {
    console.error('Assistant error:', error)
    return c.json({
      success: false,
      error: 'Failed to process message',
      details: error?.message
    }, 500)
  }
})

export default app