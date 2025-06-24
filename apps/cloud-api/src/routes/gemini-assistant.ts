import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { getGeminiService } from '../services/gemini.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

const app = new Hono()

// Protect all routes
app.use('*', authMiddleware)

// Gemini-powered chat endpoint
app.post('/chat', async (c) => {
  try {
    const { message, conversationHistory = [], companyId } = await c.req.json()
    
    if (!message) {
      return c.json({
        success: false,
        error: 'Message is required'
      }, 400)
    }

    // Get Gemini service
    const gemini = getGeminiService()
    
    // Get workspace context (emails count, etc)
    let workspaceContext = {
      email: null,
      recentEmails: 0
    }
    
    try {
      const emails = await multiTenantGmail.listEmails(companyId, 5)
      workspaceContext.recentEmails = emails.length
      if (emails.length > 0) {
        workspaceContext.email = emails[0]?.to || emails[0]?.account
      }
    } catch (error) {
      console.log('Could not fetch workspace context:', error)
    }

    // First, determine if this is a workspace action request
    const actionAnalysis = await gemini.determineWorkspaceAction(message)
    
    // If it's a specific action, handle it
    if (actionAnalysis.action !== 'unknown') {
      let actionResult = null
      
      switch (actionAnalysis.action) {
        case 'search_emails':
          const emails = await multiTenantGmail.listEmails(
            companyId, 
            10, 
            actionAnalysis.parameters?.query
          )
          actionResult = {
            type: 'emails',
            data: emails,
            count: emails.length
          }
          break
          
        case 'send_email':
          // For now, just prepare the draft
          actionResult = {
            type: 'draft_email',
            data: actionAnalysis.parameters
          }
          break
          
        case 'process_vendor_emails':
          // Process unread vendor emails
          const { emailAutomation } = await import('../services/email-automation.js')
          const vendorEmails = await multiTenantGmail.listEmails(
            companyId,
            10,
            'is:unread from:vendor'
          )
          
          const results = []
          for (const email of vendorEmails.slice(0, 3)) { // Process first 3
            try {
              const result = await emailAutomation.processVendorEmail(email.id, companyId)
              results.push({ emailId: email.id, ...result })
            } catch (error) {
              results.push({ emailId: email.id, success: false, error: error.message })
            }
          }
          
          actionResult = {
            type: 'automation_results',
            data: results,
            count: results.length
          }
          break
          
        case 'extract_invoice_data':
          // Extract data from latest invoice emails
          const invoiceEmails = await multiTenantGmail.listEmails(
            companyId,
            5,
            'subject:invoice is:unread'
          )
          
          actionResult = {
            type: 'invoice_extraction',
            data: invoiceEmails,
            count: invoiceEmails.length,
            message: 'Found invoice emails. Use email automation to process them.'
          }
          break
          
        // Add more actions as we implement them
      }
      
      const response = await gemini.chatWithContext(
        message, 
        conversationHistory,
        { ...workspaceContext, lastAction: actionAnalysis }
      )
      
      return c.json({
        success: true,
        response,
        action: actionAnalysis,
        actionResult
      })
    }
    
    // Regular chat response
    const response = await gemini.chatWithContext(
      message,
      conversationHistory,
      workspaceContext
    )
    
    return c.json({
      success: true,
      response,
      geminiPowered: true
    })
    
  } catch (error: any) {
    console.error('Gemini assistant error:', error)
    return c.json({
      success: false,
      error: 'Failed to process message',
      details: error?.message
    }, 500)
  }
})

// Analyze email endpoint
app.post('/analyze-email', async (c) => {
  try {
    const { emailId, companyId } = await c.req.json()
    
    if (!emailId) {
      return c.json({
        success: false,
        error: 'Email ID is required'
      }, 400)
    }
    
    // In the future, fetch full email content
    // For now, use the email data we have
    const emailData = {
      from: "Sender",
      subject: "Email Subject",
      body: "Email content would go here"
    }
    
    const gemini = getGeminiService()
    const analysis = await gemini.analyzeEmail(emailData)
    
    return c.json({
      success: true,
      analysis
    })
    
  } catch (error: any) {
    console.error('Email analysis error:', error)
    return c.json({
      success: false,
      error: 'Failed to analyze email',
      details: error?.message
    }, 500)
  }
})

// Extract document data endpoint
app.post('/extract-document', async (c) => {
  try {
    const { documentText, documentType = 'invoice' } = await c.req.json()
    
    if (!documentText) {
      return c.json({
        success: false,
        error: 'Document text is required'
      }, 400)
    }
    
    const gemini = getGeminiService()
    const extractedData = await gemini.extractDocumentData(documentText, documentType)
    
    return c.json({
      success: true,
      extractedData
    })
    
  } catch (error: any) {
    console.error('Document extraction error:', error)
    return c.json({
      success: false,
      error: 'Failed to extract document data',
      details: error?.message
    }, 500)
  }
})

// Generate email response endpoint
app.post('/generate-email', async (c) => {
  try {
    const { originalEmail, instructions } = await c.req.json()
    
    if (!originalEmail || !instructions) {
      return c.json({
        success: false,
        error: 'Original email and instructions are required'
      }, 400)
    }
    
    const gemini = getGeminiService()
    const generatedEmail = await gemini.generateEmailResponse(originalEmail, instructions)
    
    return c.json({
      success: true,
      generatedEmail
    })
    
  } catch (error: any) {
    console.error('Email generation error:', error)
    return c.json({
      success: false,
      error: 'Failed to generate email',
      details: error?.message
    }, 500)
  }
})

export default app