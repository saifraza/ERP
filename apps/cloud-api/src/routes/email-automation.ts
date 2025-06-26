import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { emailAutomation } from '../services/email-automation.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

const app = new Hono()

// Public health check (no auth required for debugging)
app.get('/health', async (c) => {
  try {
    // Check if we can access Gmail
    let gmailStatus = 'unknown'
    let emailCount = 0
    try {
      const emails = await multiTenantGmail.listEmails(undefined, 1)
      emailCount = emails.length
      gmailStatus = 'connected'
    } catch (e: any) {
      gmailStatus = 'error: ' + e.message
    }
    
    // Check if Gemini is available
    let geminiStatus = 'not configured'
    try {
      const gemini = emailAutomation['getGemini']()
      if (gemini) geminiStatus = 'available'
    } catch (e: any) {
      geminiStatus = 'error: ' + e.message
    }
    
    // Check environment variables
    const hasGoogleCreds = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    
    return c.json({
      success: true,
      status: 'healthy',
      gmail: gmailStatus,
      emailCount,
      gemini: geminiStatus,
      environment: {
        hasGoogleCreds,
        hasRefreshToken,
        hasGeminiKey
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return c.json({
      success: false,
      status: 'unhealthy',
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })
  }
})

// Simple test endpoint (public)
app.get('/test', async (c) => {
  try {
    return c.json({
      success: true,
      message: 'Email automation routes are working',
      auth: c.get('user') ? 'authenticated' : 'not authenticated'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error?.message
    })
  }
})

// Debug endpoint to list emails (requires auth)
app.post('/debug/list-emails', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') // Get userId from auth
    const { companyId, maxResults = 5 } = await c.req.json()
    
    console.log('Debug list emails - userId:', userId, 'companyId:', companyId)
    
    const emails = await multiTenantGmail.listEmails(userId, maxResults) // Use userId instead
    
    return c.json({
      success: true,
      count: emails.length,
      emails: emails.map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        date: e.date
      }))
    })
  } catch (error: any) {
    console.error('Debug list emails error:', error)
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, 500)
  }
})

// Apply auth middleware to all routes below this point
app.use('*', authMiddleware)

// Process a specific email
app.post('/process', async (c) => {
  try {
    const { emailId, companyId } = await c.req.json()
    
    if (!emailId) {
      return c.json({
        success: false,
        error: 'Email ID is required'
      }, 400)
    }
    
    const result = await emailAutomation.processVendorEmail(emailId, companyId)
    
    return c.json({
      success: true,
      ...result
    })
    
  } catch (error: any) {
    console.error('Email processing error:', error)
    return c.json({
      success: false,
      error: 'Failed to process email',
      details: error?.message
    }, 500)
  }
})

// Process multiple emails in batch
app.post('/process-batch', async (c) => {
  try {
    const userId = c.get('userId') // Get userId from auth middleware
    const body = await c.req.json()
    const { companyId, maxResults = 10 } = body
    
    console.log(`Processing batch emails - User: ${userId}, Company: ${companyId}, MaxResults: ${maxResults}`)
    console.log('Request body:', JSON.stringify(body))
    
    // Get unprocessed emails using userId
    let emails = []
    try {
      emails = await multiTenantGmail.listEmails(userId, maxResults) // Use userId instead of companyId
    } catch (gmailError: any) {
      console.error('Gmail list error:', gmailError)
      throw new Error(`Failed to list emails: ${gmailError.message}`)
    }
    
    console.log(`Found ${emails.length} emails to process`)
    
    const results = []
    
    for (const email of emails) {
      try {
        console.log(`Processing email: ${email.subject} (${email.id})`)
        const result = await emailAutomation.processVendorEmail(email.id, companyId)
        results.push({
          emailId: email.id,
          subject: email.subject,
          ...result
        })
      } catch (error: any) {
        console.error(`Failed to process email ${email.id}:`, error)
        results.push({
          emailId: email.id,
          subject: email.subject,
          success: false,
          error: error.message
        })
      }
    }
    
    return c.json({
      success: true,
      processed: results.length,
      results
    })
    
  } catch (error: any) {
    console.error('Batch processing error:', error)
    console.error('Error stack:', error?.stack)
    return c.json({
      success: false,
      error: 'Failed to process emails',
      details: error?.message || 'Unknown error',
      type: error?.constructor?.name || 'Error'
    }, 500)
  }
})

// Get email templates
app.get('/templates', async (c) => {
  try {
    // Return available email templates
    const templates = [
      {
        id: 'invoice_acknowledgment',
        name: 'Invoice Acknowledgment',
        subject: 'Invoice Received - {invoice_number}',
        body: 'Dear {vendor_name},\n\nWe have received your invoice {invoice_number} dated {invoice_date} for {amount}.\n\nOur accounts team will process it within 2-3 business days.\n\nBest regards,\nAccounts Team'
      },
      {
        id: 'po_confirmation',
        name: 'Purchase Order Confirmation',
        subject: 'PO {po_number} - Order Confirmation',
        body: 'Dear {customer_name},\n\nWe confirm receipt of your purchase order {po_number}.\n\nExpected delivery: {delivery_date}\n\nThank you for your business.\n\nBest regards,\nSales Team'
      },
      {
        id: 'payment_notification',
        name: 'Payment Notification',
        subject: 'Payment Processed - Invoice {invoice_number}',
        body: 'Dear {vendor_name},\n\nPayment for invoice {invoice_number} has been processed.\n\nAmount: {amount}\nTransaction Reference: {reference}\n\nBest regards,\nAccounts Team'
      }
    ]
    
    return c.json({
      success: true,
      templates
    })
    
  } catch (error: any) {
    console.error('Templates error:', error)
    return c.json({
      success: false,
      error: 'Failed to get templates',
      details: error?.message
    }, 500)
  }
})

// Create or update email template
app.post('/templates', async (c) => {
  try {
    const template = await c.req.json()
    
    if (!template.id || !template.name || !template.subject || !template.body) {
      return c.json({
        success: false,
        error: 'Template ID, name, subject, and body are required'
      }, 400)
    }
    
    // In a real implementation, this would save to database
    console.log('Saving template:', template)
    
    return c.json({
      success: true,
      template
    })
    
  } catch (error: any) {
    console.error('Template save error:', error)
    return c.json({
      success: false,
      error: 'Failed to save template',
      details: error?.message
    }, 500)
  }
})

// Get automation rules
app.get('/rules', async (c) => {
  try {
    // Return configured automation rules
    const rules = [
      {
        id: 'auto_acknowledge_invoices',
        name: 'Auto-acknowledge Invoices',
        enabled: true,
        conditions: {
          emailType: 'invoice',
          from: ['*@vendor.com']
        },
        actions: ['send_acknowledgment', 'apply_label', 'extract_data']
      },
      {
        id: 'auto_approve_small_invoices',
        name: 'Auto-approve Small Invoices',
        enabled: true,
        conditions: {
          emailType: 'invoice',
          amountLessThan: 1000
        },
        actions: ['auto_approve', 'notify_accounts']
      }
    ]
    
    return c.json({
      success: true,
      rules
    })
    
  } catch (error: any) {
    console.error('Rules error:', error)
    return c.json({
      success: false,
      error: 'Failed to get rules',
      details: error?.message
    }, 500)
  }
})

// Create or update automation rule
app.post('/rules', async (c) => {
  try {
    const rule = await c.req.json()
    
    if (!rule.id || !rule.name || !rule.conditions || !rule.actions) {
      return c.json({
        success: false,
        error: 'Rule ID, name, conditions, and actions are required'
      }, 400)
    }
    
    // In a real implementation, this would save to database
    console.log('Saving rule:', rule)
    
    return c.json({
      success: true,
      rule
    })
    
  } catch (error: any) {
    console.error('Rule save error:', error)
    return c.json({
      success: false,
      error: 'Failed to save rule',
      details: error?.message
    }, 500)
  }
})

// Get processing history
app.get('/history', async (c) => {
  try {
    const { companyId, limit = 50 } = c.req.query()
    
    // In a real implementation, this would fetch from database
    const history = [
      {
        emailId: 'msg123',
        subject: 'Invoice #INV-2024-001',
        from: 'vendor@example.com',
        processedAt: new Date().toISOString(),
        status: 'completed',
        extractedData: {
          invoiceNumber: 'INV-2024-001',
          amount: 5000,
          dueDate: '2024-02-15'
        },
        actions: ['send_acknowledgment', 'apply_label', 'create_task']
      }
    ]
    
    return c.json({
      success: true,
      history
    })
    
  } catch (error: any) {
    console.error('History error:', error)
    return c.json({
      success: false,
      error: 'Failed to get history',
      details: error?.message
    }, 500)
  }
})

export default app