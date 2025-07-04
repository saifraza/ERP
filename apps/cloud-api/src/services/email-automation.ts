import { multiTenantGmail } from './multi-tenant-gmail.js'
import { getGeminiService } from './gemini.js'
import { prisma } from '../lib/prisma.js'
import { google } from 'googleapis'

export interface EmailRule {
  id: string
  name: string
  conditions: {
    from?: string[]
    subject?: string[]
    hasAttachment?: boolean
    bodyContains?: string[]
  }
  actions: {
    label?: string
    autoReply?: boolean
    extractData?: boolean
    createTask?: boolean
    notify?: string[]
  }
  priority: number
}

export interface ProcessedEmail {
  emailId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  extractedData?: any
  actions: string[]
  processedAt?: Date
  error?: string
}

export class EmailAutomationService {
  private gemini: any = null
  
  private getGemini() {
    if (!this.gemini) {
      try {
        this.gemini = getGeminiService()
      } catch (error) {
        console.warn('Gemini service not available:', error.message)
        return null
      }
    }
    return this.gemini
  }
  
  /**
   * Process incoming vendor emails
   */
  async processVendorEmail(emailId: string, companyId?: string) {
    try {
      // Get email details
      const email = await this.getEmailDetails(emailId, companyId)
      
      // Check if this is a procurement-related email
      const isProcurementEmail = await this.isProcurementRelated(email)
      
      if (isProcurementEmail && companyId) {
        // Use procurement automation service for procurement emails
        const { procurementAutomation } = await import('./procurement-automation.js')
        const result = await procurementAutomation.processVendorEmail(email, companyId)
        
        // Store processing result
        await this.storeProcessingResult({
          emailId,
          status: 'completed',
          extractedData: result,
          actions: [result.action || 'processed'],
          processedAt: new Date()
        })
        
        return result
      }
      
      // Original processing for non-procurement emails
      const emailType = await this.identifyEmailType(email)
      const attachments = await this.processAttachments(email, companyId)
      const extractedData = await this.extractBusinessData(email, attachments, emailType)
      const actions = await this.applyBusinessRules(email, extractedData, emailType)
      
      await this.executeActions(actions, email, extractedData, companyId)
      
      await this.storeProcessingResult({
        emailId,
        status: 'completed',
        extractedData,
        actions: actions.map(a => a.type),
        processedAt: new Date()
      })
      
      return {
        success: true,
        emailType,
        extractedData,
        actions: actions.map(a => a.type)
      }
      
    } catch (error: any) {
      console.error('Email processing error:', error)
      
      await this.storeProcessingResult({
        emailId,
        status: 'failed',
        error: error.message,
        actions: [],
        processedAt: new Date()
      })
      
      throw error
    }
  }
  
  /**
   * Check if email is procurement related
   */
  private async isProcurementRelated(email: any): Promise<boolean> {
    const keywords = [
      'quotation', 'quote', 'rfq', 'invoice', 'purchase order', 
      'po number', 'delivery', 'payment', 'vendor', 'supplier',
      'procurement', 'pricing', 'bid', 'tender'
    ]
    
    const text = `${email.subject} ${email.body}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword))
  }
  
  /**
   * Get full email details including attachments
   */
  private async getEmailDetails(emailId: string, companyId?: string) {
    // Use the new method that properly handles full email content
    const email = await multiTenantGmail.getEmailContent(companyId, emailId)
    
    return {
      id: email.id,
      threadId: email.threadId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      date: email.date,
      body: email.textBody || email.htmlBody || '',
      attachments: email.attachments
    }
  }
  
  /**
   * Identify email type using AI
   */
  private async identifyEmailType(email: any): Promise<string> {
    const gemini = this.getGemini()
    if (!gemini) {
      // Fallback to simple keyword matching if Gemini is not available
      const subject = email.subject?.toLowerCase() || ''
      const body = email.body?.toLowerCase() || ''
      const combined = subject + ' ' + body
      
      if (combined.includes('invoice')) return 'invoice'
      if (combined.includes('purchase order') || combined.includes('po ')) return 'purchase_order'
      if (combined.includes('quotation') || combined.includes('quote')) return 'quotation'
      if (combined.includes('contract')) return 'contract'
      if (combined.includes('payment')) return 'payment_notification'
      return 'other'
    }
    
    const prompt = `Analyze this business email and categorize it:
    
    From: ${email.from}
    Subject: ${email.subject}
    Body Preview: ${email.body?.substring(0, 500)}
    
    Categories:
    - invoice: Invoice or billing document
    - purchase_order: Purchase order from customer
    - quotation: Price quote or RFQ response
    - contract: Contract or agreement
    - payment_notification: Payment confirmation
    - general_inquiry: General business inquiry
    - complaint: Customer complaint
    - other: Other business communication
    
    Return only the category name.`
    
    const response = await gemini.generateResponse(prompt)
    return response.trim().toLowerCase()
  }
  
  /**
   * Process email attachments
   */
  private async processAttachments(email: any, companyId?: string) {
    if (!email.attachments || email.attachments.length === 0) {
      return []
    }
    
    const { client } = await multiTenantGmail.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    const processedAttachments = []
    
    for (const attachment of email.attachments) {
      try {
        // Get attachment data
        const attachmentData = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: email.id,
          id: attachment.attachmentId
        })
        
        // Decode base64 data
        const data = attachmentData.data.data
        const buffer = Buffer.from(data!, 'base64')
        
        // For now, convert to text if possible (PDF parsing would need additional library)
        const text = buffer.toString('utf-8')
        
        processedAttachments.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          text: text,
          data: buffer
        })
        
      } catch (error) {
        console.error(`Failed to process attachment ${attachment.filename}:`, error)
      }
    }
    
    return processedAttachments
  }
  
  /**
   * Extract business data from email and attachments
   */
  private async extractBusinessData(email: any, attachments: any[], emailType: string) {
    const gemini = this.getGemini()
    const combinedText = `
      Email Subject: ${email.subject}
      Email Body: ${email.body}
      ${attachments.map(a => `Attachment ${a.filename}: ${a.text?.substring(0, 1000)}`).join('\n')}
    `
    
    if (!gemini) {
      // Fallback to basic extraction without AI
      const basicData: any = {
        emailType,
        subject: email.subject,
        from: email.from,
        date: email.date,
        hasAttachments: attachments.length > 0
      }
      
      // Try to extract some basic info with regex
      const amountMatch = combinedText.match(/(?:total|amount|₹|rs\.?|inr)\s*:?\s*([\d,]+(?:\.\d{2})?)/i)
      if (amountMatch) {
        basicData.totalAmount = amountMatch[1].replace(/,/g, '')
      }
      
      const invoiceMatch = combinedText.match(/(?:invoice|bill)\s*(?:no|number|#)?\s*:?\s*([A-Z0-9\-\/]+)/i)
      if (invoiceMatch) {
        basicData.invoiceNumber = invoiceMatch[1]
      }
      
      return basicData
    }
    
    let extractionPrompt = ''
    
    switch (emailType) {
      case 'invoice':
        extractionPrompt = `Extract invoice details from this email:
        ${combinedText}
        
        Extract:
        - Invoice number
        - Invoice date
        - Vendor name
        - Total amount
        - Due date
        - Line items (if available)
        - Payment terms
        
        Return as JSON.`
        break
        
      case 'purchase_order':
        extractionPrompt = `Extract purchase order details:
        ${combinedText}
        
        Extract:
        - PO number
        - Customer name
        - Order date
        - Delivery date
        - Items with quantities
        - Total amount
        - Delivery address
        
        Return as JSON.`
        break
        
      case 'quotation':
        extractionPrompt = `Extract quotation details:
        ${combinedText}
        
        Extract:
        - Quote number
        - Valid until date
        - Items with prices
        - Total amount
        - Terms and conditions
        - Delivery time
        
        Return as JSON.`
        break
        
      default:
        extractionPrompt = `Extract key business information:
        ${combinedText}
        
        Extract any relevant business data like:
        - Reference numbers
        - Dates
        - Amounts
        - Company names
        - Important terms
        
        Return as JSON.`
    }
    
    const response = await gemini.generateResponse(extractionPrompt)
    
    try {
      return JSON.parse(response)
    } catch {
      return { rawText: response }
    }
  }
  
  /**
   * Apply business rules to determine actions
   */
  private async applyBusinessRules(email: any, extractedData: any, emailType: string) {
    const actions = []
    
    // Auto-acknowledgment rules
    if (['invoice', 'purchase_order', 'quotation'].includes(emailType)) {
      actions.push({
        type: 'send_acknowledgment',
        template: `${emailType}_received`
      })
    }
    
    // Data validation and ERP integration
    if (emailType === 'invoice' && extractedData.invoiceNumber) {
      actions.push({
        type: 'validate_invoice',
        data: extractedData
      })
      
      // Auto-approve small invoices
      if (extractedData.totalAmount && parseFloat(extractedData.totalAmount) < 1000) {
        actions.push({
          type: 'auto_approve',
          reason: 'Below auto-approval threshold'
        })
      }
    }
    
    // Create tasks for manual review
    if (emailType === 'contract' || (extractedData.totalAmount && parseFloat(extractedData.totalAmount) > 10000)) {
      actions.push({
        type: 'create_task',
        assignTo: 'finance_team',
        priority: 'high'
      })
    }
    
    // Label emails
    actions.push({
      type: 'apply_label',
      label: `vendor/${emailType}`
    })
    
    return actions
  }
  
  /**
   * Execute determined actions
   */
  private async executeActions(actions: any[], email: any, extractedData: any, companyId?: string) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_acknowledgment':
            await this.sendAcknowledgment(email, action.template, companyId)
            break
            
          case 'apply_label':
            await this.applyLabel(email.id, action.label, companyId)
            break
            
          case 'create_task':
            await this.createTask(email, extractedData, action)
            break
            
          case 'validate_invoice':
            await this.validateInvoice(action.data)
            break
            
          case 'auto_approve':
            await this.autoApprove(email, extractedData, action.reason)
            break
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error)
      }
    }
  }
  
  /**
   * Send acknowledgment email
   */
  private async sendAcknowledgment(email: any, template: string, companyId?: string) {
    const templates: Record<string, string> = {
      invoice_received: `
        <p>Dear Vendor,</p>
        <p>We have received your invoice (Subject: ${email.subject}).</p>
        <p>Our accounts team will review and process it within 2-3 business days.</p>
        <p>Best regards,<br>Accounts Team</p>
      `,
      purchase_order_received: `
        <p>Dear Customer,</p>
        <p>We have received your purchase order (Subject: ${email.subject}).</p>
        <p>We will review and confirm the order details shortly.</p>
        <p>Best regards,<br>Sales Team</p>
      `,
      quotation_received: `
        <p>Thank you for your quotation (Subject: ${email.subject}).</p>
        <p>We will review and get back to you soon.</p>
        <p>Best regards,<br>Procurement Team</p>
      `
    }
    
    const body = templates[template] || 'Thank you for your email. We will review and respond soon.'
    
    await multiTenantGmail.sendEmail(
      companyId,
      email.from,
      `Re: ${email.subject}`,
      body
    )
  }
  
  /**
   * Apply Gmail label
   */
  private async applyLabel(emailId: string, labelName: string, companyId?: string) {
    const { client } = await multiTenantGmail.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    // Create label if it doesn't exist
    try {
      const labels = await gmail.users.labels.list({ userId: 'me' })
      let label = labels.data.labels?.find(l => l.name === labelName)
      
      if (!label) {
        const newLabel = await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          }
        })
        label = newLabel.data
      }
      
      // Apply label to email
      if (label?.id) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: emailId,
          requestBody: {
            addLabelIds: [label.id]
          }
        })
      }
    } catch (error) {
      console.error('Failed to apply label:', error)
    }
  }
  
  /**
   * Create task in the system
   */
  private async createTask(email: any, extractedData: any, action: any) {
    // This would integrate with your task management system
    console.log('Creating task:', {
      title: `Review ${email.subject}`,
      assignedTo: action.assignTo,
      priority: action.priority,
      data: extractedData
    })
  }
  
  /**
   * Validate invoice against ERP data
   */
  private async validateInvoice(invoiceData: any) {
    // This would check against your ERP database
    console.log('Validating invoice:', invoiceData)
  }
  
  /**
   * Auto-approve transaction
   */
  private async autoApprove(email: any, extractedData: any, reason: string) {
    console.log('Auto-approving:', {
      email: email.subject,
      reason,
      data: extractedData
    })
  }
  
  /**
   * Store processing result
   */
  private async storeProcessingResult(result: ProcessedEmail) {
    // Store in database for audit trail
    console.log('Storing result:', result)
  }
  
  /**
   * Extract email body text
   */
  private extractBody(payload: any): string {
    let body = ''
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.parts) {
          body += this.extractBody(part)
        }
      }
    } else if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    }
    
    return body
  }
  
  /**
   * Extract attachment information
   */
  private extractAttachmentInfo(payload: any): any[] {
    const attachments: any[] = []
    
    const extractFromParts = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId
          })
        }
        if (part.parts) {
          extractFromParts(part.parts)
        }
      }
    }
    
    if (payload.parts) {
      extractFromParts(payload.parts)
    }
    
    return attachments
  }
}

// Export singleton instance
export const emailAutomation = new EmailAutomationService()