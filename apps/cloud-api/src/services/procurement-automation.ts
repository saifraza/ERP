import { prisma } from '../lib/prisma.js'
import { multiTenantGmail } from './multi-tenant-gmail.js'
import { getGeminiService } from './gemini.js'
import { rfqPDFFinal } from './rfq-pdf-final.js'

export class ProcurementAutomationService {
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
   * Process vendor emails and create appropriate documents
   */
  async processVendorEmail(email: any, companyId: string) {
    const gemini = this.getGemini()
    if (!gemini) {
      throw new Error('AI service not available')
    }
    
    // Determine email type and extract data
    const emailType = await this.identifyProcurementEmailType(email)
    const extractedData = await this.extractProcurementData(email, emailType)
    
    // Process based on email type
    switch (emailType) {
      case 'quotation':
        return await this.processQuotation(email, extractedData, companyId)
      
      case 'invoice':
        return await this.processInvoice(email, extractedData, companyId)
      
      case 'po_acknowledgment':
        return await this.processPOAcknowledgment(email, extractedData, companyId)
      
      case 'delivery_notification':
        return await this.processDeliveryNotification(email, extractedData, companyId)
      
      default:
        return {
          type: emailType,
          message: 'Email processed but no specific action taken',
          extractedData
        }
    }
  }
  
  /**
   * Identify procurement email type
   */
  private async identifyProcurementEmailType(email: any): Promise<string> {
    const gemini = this.getGemini()
    if (!gemini) {
      // Fallback to keyword matching
      const text = `${email.subject} ${email.body}`.toLowerCase()
      
      if (text.includes('quotation') || text.includes('quote')) return 'quotation'
      if (text.includes('invoice') || text.includes('bill')) return 'invoice'
      if (text.includes('purchase order') && text.includes('acknowledg')) return 'po_acknowledgment'
      if (text.includes('delivery') || text.includes('dispatch')) return 'delivery_notification'
      if (text.includes('payment') && text.includes('received')) return 'payment_confirmation'
      
      return 'general'
    }
    
    const prompt = `Classify this procurement email into one of these types:
    - quotation: Price quotation in response to RFQ
    - invoice: Vendor invoice for payment
    - po_acknowledgment: Vendor acknowledging purchase order
    - delivery_notification: Shipment/delivery update
    - payment_confirmation: Payment received confirmation
    - general: Other procurement communication
    
    Email:
    Subject: ${email.subject}
    Body: ${email.body}
    
    Return only the type name.`
    
    const response = await gemini.generateResponse(prompt)
    return response.trim().toLowerCase()
  }
  
  /**
   * Extract procurement data based on email type
   */
  private async extractProcurementData(email: any, emailType: string) {
    const gemini = this.getGemini()
    if (!gemini) {
      return { emailType, subject: email.subject, from: email.from }
    }
    
    let prompt = ''
    
    switch (emailType) {
      case 'quotation':
        prompt = `Extract quotation details from this email:
        ${email.body}
        
        Extract:
        - RFQ number (if mentioned)
        - Quotation number
        - Vendor name
        - Items with prices
        - Total amount
        - Validity period
        - Payment terms
        - Delivery terms
        
        Return as JSON.`
        break
        
      case 'invoice':
        prompt = `Extract invoice details from this email:
        ${email.body}
        
        Extract:
        - Invoice number
        - Invoice date
        - PO number (if mentioned)
        - Vendor name
        - Items with amounts
        - Subtotal
        - Tax amount
        - Total amount
        - Due date
        - Bank details
        
        Return as JSON.`
        break
        
      case 'po_acknowledgment':
        prompt = `Extract PO acknowledgment details:
        ${email.body}
        
        Extract:
        - PO number
        - Acknowledgment date
        - Expected delivery date
        - Any conditions or exceptions
        
        Return as JSON.`
        break
    }
    
    if (prompt) {
      const response = await gemini.generateResponse(prompt)
      try {
        return JSON.parse(response)
      } catch (e) {
        return { raw: response, emailType }
      }
    }
    
    return { emailType }
  }
  
  /**
   * Process quotation email
   */
  private async processQuotation(email: any, data: any, companyId: string) {
    // Find vendor by email
    const vendor = await prisma.vendor.findFirst({
      where: {
        companyId,
        email: email.from.match(/<(.+)>/)?.[1] || email.from
      }
    })
    
    if (!vendor) {
      return {
        success: false,
        error: 'Vendor not found',
        action: 'manual_review_required',
        data
      }
    }
    
    // Find related RFQ if mentioned
    let rfq = null
    if (data.rfqNumber) {
      rfq = await prisma.rFQ.findFirst({
        where: {
          companyId,
          rfqNumber: data.rfqNumber
        }
      })
    }
    
    // Generate quotation number
    const quotationNumber = await this.generateQuotationNumber(companyId)
    
    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        companyId,
        quotationNumber,
        rfqId: rfq?.id,
        vendorId: vendor.id,
        quotationDate: new Date(),
        validUntil: this.calculateValidUntil(data.validityPeriod),
        subtotal: data.subtotal || data.totalAmount || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        paymentTerms: data.paymentTerms || vendor.creditDays + ' days',
        deliveryTerms: data.deliveryTerms || 'Ex-Works',
        status: 'received',
        emailId: email.id,
        notes: `Auto-processed from email: ${email.subject}`
      }
    })
    
    // Send acknowledgment
    await this.sendQuotationAcknowledgment(vendor, quotation, companyId)
    
    return {
      success: true,
      action: 'quotation_created',
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      vendorName: vendor.name,
      totalAmount: quotation.totalAmount
    }
  }
  
  /**
   * Process invoice email
   */
  private async processInvoice(email: any, data: any, companyId: string) {
    // Find vendor
    const vendor = await prisma.vendor.findFirst({
      where: {
        companyId,
        email: email.from.match(/<(.+)>/)?.[1] || email.from
      }
    })
    
    if (!vendor) {
      return {
        success: false,
        error: 'Vendor not found',
        action: 'manual_review_required',
        data
      }
    }
    
    // Find related PO if mentioned
    let po = null
    if (data.poNumber) {
      po = await prisma.purchaseOrder.findFirst({
        where: {
          companyId,
          poNumber: data.poNumber,
          vendorId: vendor.id
        }
      })
    }
    
    // Check if invoice already exists
    const existing = await prisma.vendorInvoice.findFirst({
      where: {
        companyId,
        vendorId: vendor.id,
        invoiceNumber: data.invoiceNumber
      }
    })
    
    if (existing) {
      return {
        success: false,
        error: 'Invoice already exists',
        invoiceId: existing.id
      }
    }
    
    // Create invoice
    const invoice = await prisma.vendorInvoice.create({
      data: {
        companyId,
        invoiceNumber: data.invoiceNumber,
        vendorId: vendor.id,
        poId: po?.id,
        invoiceDate: new Date(data.invoiceDate || new Date()),
        dueDate: this.calculateDueDate(data.dueDate, vendor.creditDays),
        subtotal: data.subtotal || data.totalAmount || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        status: 'received',
        emailId: email.id,
        notes: `Auto-processed from email: ${email.subject}`
      }
    })
    
    // Send acknowledgment
    await this.sendInvoiceAcknowledgment(vendor, invoice, companyId)
    
    // Create approval task if amount is above threshold
    if (invoice.totalAmount > 10000) {
      // TODO: Create approval task
    }
    
    return {
      success: true,
      action: 'invoice_created',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      vendorName: vendor.name,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate
    }
  }
  
  /**
   * Process PO acknowledgment
   */
  private async processPOAcknowledgment(email: any, data: any, companyId: string) {
    if (!data.poNumber) {
      return {
        success: false,
        error: 'PO number not found in email',
        action: 'manual_review_required'
      }
    }
    
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        companyId,
        poNumber: data.poNumber
      },
      include: {
        vendor: true
      }
    })
    
    if (!po) {
      return {
        success: false,
        error: 'Purchase order not found',
        poNumber: data.poNumber
      }
    }
    
    // Update PO status
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        vendorAcknowledged: true,
        acknowledgedAt: new Date(),
        deliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : po.deliveryDate
      }
    })
    
    return {
      success: true,
      action: 'po_acknowledged',
      poNumber: po.poNumber,
      vendorName: po.vendor.name,
      expectedDelivery: data.expectedDeliveryDate || po.deliveryDate
    }
  }
  
  /**
   * Process delivery notification
   */
  private async processDeliveryNotification(email: any, data: any, companyId: string) {
    // TODO: Implement delivery notification processing
    return {
      success: true,
      action: 'delivery_notification_received',
      data
    }
  }
  
  /**
   * Send quotation acknowledgment email
   */
  private async sendQuotationAcknowledgment(vendor: any, quotation: any, companyId: string) {
    const emailBody = `
Dear ${vendor.contactPerson},

We acknowledge receipt of your quotation ${quotation.quotationNumber} dated ${quotation.quotationDate.toLocaleDateString()}.

Your quotation is currently under review. We will contact you if we need any clarifications.

Thank you for your prompt response.

Best regards,
Procurement Team
    `
    
    try {
      await multiTenantGmail.sendEmail(
        companyId,
        vendor.email,
        `RE: Quotation Acknowledgment - ${quotation.quotationNumber}`,
        emailBody
      )
    } catch (error) {
      console.error('Failed to send quotation acknowledgment:', error)
    }
  }
  
  /**
   * Send invoice acknowledgment email
   */
  private async sendInvoiceAcknowledgment(vendor: any, invoice: any, companyId: string) {
    const emailBody = `
Dear ${vendor.contactPerson},

We acknowledge receipt of your invoice ${invoice.invoiceNumber} dated ${invoice.invoiceDate.toLocaleDateString()} for ₹${invoice.totalAmount.toLocaleString()}.

Your invoice has been forwarded to our accounts department for processing. Payment will be made as per the agreed terms.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ₹${invoice.totalAmount.toLocaleString()}
- Due Date: ${invoice.dueDate.toLocaleDateString()}

Best regards,
Accounts Team
    `
    
    try {
      await multiTenantGmail.sendEmail(
        companyId,
        vendor.email,
        `RE: Invoice Acknowledgment - ${invoice.invoiceNumber}`,
        emailBody
      )
    } catch (error) {
      console.error('Failed to send invoice acknowledgment:', error)
    }
  }
  
  /**
   * Generate quotation number
   */
  private async generateQuotationNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear()
    const lastQuotation = await prisma.quotation.findFirst({
      where: {
        companyId,
        quotationNumber: { startsWith: `QT-${year}` }
      },
      orderBy: { quotationNumber: 'desc' },
      select: { quotationNumber: true }
    })
    
    let sequence = 1
    if (lastQuotation) {
      const lastSequence = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0')
      sequence = lastSequence + 1
    }
    
    return `QT-${year}-${String(sequence).padStart(4, '0')}`
  }
  
  /**
   * Calculate validity date
   */
  private calculateValidUntil(validityPeriod: any): Date {
    const date = new Date()
    
    if (typeof validityPeriod === 'string') {
      const match = validityPeriod.match(/(\d+)\s*(days?|weeks?|months?)/i)
      if (match) {
        const [, amount, unit] = match
        const num = parseInt(amount)
        
        switch (unit.toLowerCase()) {
          case 'day':
          case 'days':
            date.setDate(date.getDate() + num)
            break
          case 'week':
          case 'weeks':
            date.setDate(date.getDate() + (num * 7))
            break
          case 'month':
          case 'months':
            date.setMonth(date.getMonth() + num)
            break
        }
      }
    }
    
    // Default to 30 days if not specified
    if (date.getTime() === new Date().getTime()) {
      date.setDate(date.getDate() + 30)
    }
    
    return date
  }
  
  /**
   * Calculate due date
   */
  private calculateDueDate(dueDate: any, creditDays: number): Date {
    if (dueDate) {
      return new Date(dueDate)
    }
    
    const date = new Date()
    date.setDate(date.getDate() + creditDays)
    return date
  }
  
  /**
   * Send RFQ to vendors
   */
  async sendRFQToVendors(
    rfqId: string, 
    vendorIds?: string[],
    emailOptions?: {
      customSubject?: string
      customBody?: string
      ccEmails?: string[]
      isReminder?: boolean
    }
  ) {
    console.log('=== sendRFQToVendors START ===')
    console.log('RFQ ID:', rfqId)
    console.log('Vendor IDs:', vendorIds)
    console.log('Email Options:', emailOptions)
    
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        company: true,
        vendors: true,
        items: true,
        requisition: {
          include: {
            division: true
          }
        }
      }
    })
    
    if (!rfq) {
      throw new Error('RFQ not found')
    }
    
    console.log('RFQ Details:', {
      rfqNumber: rfq.rfqNumber,
      companyId: rfq.companyId,
      companyName: rfq.company.name,
      vendorsCount: rfq.vendors.length
    })
    
    // Email template with HTML formatting
    const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 20px; }
    .details { background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .details h3 { margin-top: 0; color: #2c3e50; }
    .details ul { margin: 10px 0; padding-left: 20px; }
    .instructions { background-color: #e8f4f8; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .instructions h3 { margin-top: 0; color: #2980b9; }
    .instructions ol { margin: 10px 0; padding-left: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .signature { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Dear {vendorName},</p>
      <p>Greetings from <strong>{companyName}</strong>!</p>
    </div>
    
    <p>We are pleased to invite you to submit your competitive quotation for our requirement as per the attached Request for Quotation (RFQ) document.</p>
    
    <div class="details">
      <h3>RFQ Details:</h3>
      <ul>
        <li><strong>RFQ Number:</strong> {rfqNumber}</li>
        <li><strong>Issue Date:</strong> {issueDate}</li>
        <li><strong>Due Date:</strong> {dueDate}</li>
        <li><strong>Division:</strong> {division}</li>
      </ul>
    </div>
    
    <p>Please find attached the detailed RFQ document which contains:</p>
    <ul>
      <li>Complete item specifications and quantities</li>
      <li>Commercial terms and conditions</li>
      <li>Technical requirements</li>
      <li>Submission guidelines</li>
      <li>Evaluation criteria</li>
    </ul>
    
    <div class="instructions">
      <h3>Important Instructions:</h3>
      <ol>
        <li>Please submit your quotation on or before <strong>{dueDate}</strong></li>
        <li>Quote your best prices in INR inclusive of all taxes (show GST separately)</li>
        <li>Mention delivery period for each item</li>
        <li>Quotation should be valid for minimum 90 days</li>
        <li>Send your quotation via email reply with "Quotation for RFQ {rfqNumber}" in subject line</li>
      </ol>
    </div>
    
    <p>For any clarifications, please feel free to contact us.</p>
    
    <p>We look forward to receiving your competitive quotation and establishing a long-term business relationship.</p>
    
    <div class="signature">
      <p>Best regards,</p>
      <p>
        <strong>{signatoryName}</strong><br>
        {signatoryDesignation}<br>
        {companyName}<br>
        Email: {companyEmail}<br>
        Phone: {companyPhone}
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email address.</p>
    </div>
  </div>
</body>
</html>`
    
    const results = []
    
    // Filter vendors if specific vendorIds provided
    const vendorsToProcess = vendorIds 
      ? rfq.vendors.filter(v => vendorIds.includes(v.vendorId))
      : rfq.vendors
    
    console.log(`Processing ${vendorsToProcess.length} vendors`)
    
    for (const rfqVendor of vendorsToProcess) {
      try {
        const vendor = await prisma.vendor.findUnique({
          where: { id: rfqVendor.vendorId }
        })
        
        if (!vendor) {
          console.log(`Vendor not found for ID: ${rfqVendor.vendorId}`)
          continue
        }
        
        if (!vendor.email) {
          console.log(`No email address for vendor: ${vendor.name} (${vendor.code})`)
          results.push({
            success: false,
            vendorId: vendor.id,
            vendorName: vendor.name,
            error: 'No email address'
          })
          continue
        }
        
        console.log(`Sending RFQ to vendor: ${vendor.name} (${vendor.email})`)
        
        // Generate vendor-specific PDF
        const pdfBuffer = await rfqPDFFinal.generateVendorRFQPDF(rfqId, vendor.id)
        const pdfFilename = `RFQ_${rfq.rfqNumber}_${vendor.code}.pdf`
        
        // Prepare email body - use custom body if provided
        const emailBody = emailOptions?.customBody 
          ? emailOptions.customBody
              .replace(/{vendorName}/g, vendor.contactPerson || vendor.name)
              .replace(/{companyName}/g, rfq.company.name)
              .replace(/{rfqNumber}/g, rfq.rfqNumber)
              .replace(/{issueDate}/g, new Date(rfq.issueDate).toLocaleDateString('en-IN'))
              .replace(/{dueDate}/g, new Date(rfq.submissionDeadline).toLocaleDateString('en-IN'))
              .replace(/{division}/g, rfq.requisition?.division?.name || 'General')
              .replace(/{signatoryName}/g, 'Procurement Team')
              .replace(/{signatoryDesignation}/g, 'Purchase Department')
              .replace(/{companyEmail}/g, rfq.company.email)
              .replace(/{companyPhone}/g, rfq.company.phone)
          : emailTemplate
              .replace(/{vendorName}/g, vendor.contactPerson || vendor.name)
              .replace(/{companyName}/g, rfq.company.name)
              .replace(/{rfqNumber}/g, rfq.rfqNumber)
              .replace(/{issueDate}/g, new Date(rfq.issueDate).toLocaleDateString('en-IN'))
              .replace(/{dueDate}/g, new Date(rfq.submissionDeadline).toLocaleDateString('en-IN'))
              .replace(/{division}/g, rfq.requisition?.division?.name || 'General')
              .replace(/{signatoryName}/g, 'Procurement Team')
              .replace(/{signatoryDesignation}/g, 'Purchase Department')
              .replace(/{companyEmail}/g, rfq.company.email)
              .replace(/{companyPhone}/g, rfq.company.phone)
        
        // Send email with PDF attachment - use custom subject if provided
        const subject = emailOptions?.customSubject || `Request for Quotation - ${rfq.rfqNumber} - ${rfq.company.name}`
        console.log(`Sending email to ${vendor.email} with subject: ${subject}`)
        
        let emailResult: any
        try {
          // Prepare CC emails if provided
          const ccEmails = emailOptions?.ccEmails?.join(', ') || undefined
          
          emailResult = await multiTenantGmail.sendEmailWithAttachment(
            rfq.companyId,
            vendor.email,
            subject,
            emailBody,
            [
              {
                filename: pdfFilename,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ],
            ccEmails  // Pass CC emails
          )
          console.log(`Email sent successfully to ${vendor.email}:`, emailResult)
        } catch (emailError: any) {
          console.error(`Failed to send email to ${vendor.email}:`, emailError)
          throw emailError
        }
        
        // Create email log
        await prisma.rFQEmailLog.create({
          data: {
            rfqId: rfq.id,
            vendorId: vendor.id,
            emailType: emailOptions?.isReminder ? 'reminder_sent' : 'rfq_sent',
            emailId: emailResult.messageId,
            subject: subject,
            toEmail: vendor.email,
            ccEmails: emailOptions?.ccEmails ? JSON.stringify(emailOptions.ccEmails) : null,
            attachments: JSON.stringify([pdfFilename]),
            status: 'sent',
            sentAt: new Date()
          }
        })
        
        // Create or update communication thread
        await prisma.rFQCommunicationThread.upsert({
          where: {
            rfqId_vendorId: {
              rfqId: rfq.id,
              vendorId: vendor.id
            }
          },
          create: {
            rfqId: rfq.id,
            vendorId: vendor.id,
            threadId: emailResult.threadId,
            messageCount: 1,
            lastMessageAt: new Date(),
            status: 'active'
          },
          update: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date()
          }
        })
        
        // Update RFQ vendor status
        await prisma.rFQVendor.update({
          where: { id: rfqVendor.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
            lastEmailSentAt: new Date()
          }
        })
        
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          email: vendor.email,
          success: true,
          messageId: emailResult.messageId
        })
      } catch (error: any) {
        console.error(`Failed to send RFQ to vendor ${rfqVendor.vendorId}:`, error)
        
        // Create email log for failed attempt
        try {
          await prisma.rFQEmailLog.create({
            data: {
              rfqId: rfq.id,
              vendorId: vendor.id,
              emailType: emailOptions?.isReminder ? 'reminder_sent' : 'rfq_sent',
              subject: subject,
              toEmail: vendor.email,
              ccEmails: emailOptions?.ccEmails ? JSON.stringify(emailOptions.ccEmails) : null,
              attachments: JSON.stringify([pdfFilename]),
              status: 'failed',
              sentAt: new Date(),
              error: error.message
            }
          })
        } catch (logError) {
          console.error('Failed to create email log for failed attempt:', logError)
        }
        
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          success: false,
          error: error.message
        })
      }
    }
    
    // Update RFQ status
    console.log('Updating RFQ status to SENT')
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: 'SENT' }
    })
    
    return {
      success: true,
      rfqNumber: rfq.rfqNumber,
      totalVendors: vendorsToProcess.length,
      sentCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    }
  }
}

// Export singleton instance
export const procurementAutomation = new ProcurementAutomationService()