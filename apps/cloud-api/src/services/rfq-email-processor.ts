import { prisma } from '../lib/prisma.js'
import { multiTenantGmail } from './multi-tenant-gmail.js'
import { getGeminiService } from './gemini.js'

export class RFQEmailProcessor {
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
   * Process incoming emails for RFQ responses
   */
  async processRFQEmails(companyId: string) {
    try {
      // Fetch unread emails
      const emails = await multiTenantGmail.fetchUnreadEmails(companyId, {
        maxResults: 50,
        query: 'subject:(RFQ OR "Request for Quotation" OR Quotation)'
      })
      
      const results = []
      
      for (const email of emails) {
        try {
          // Check if email is from a vendor
          const vendor = await prisma.vendor.findFirst({
            where: {
              companyId,
              email: email.from.match(/<(.+)>/)?.[1] || email.from
            }
          })
          
          if (!vendor) {
            console.log(`Email from non-vendor: ${email.from}`)
            continue
          }
          
          // Check if this is a response to an RFQ
          const rfqNumber = this.extractRFQNumber(email.subject, email.body)
          if (!rfqNumber) {
            console.log(`No RFQ number found in email from ${vendor.name}`)
            continue
          }
          
          // Find the RFQ
          const rfq = await prisma.rFQ.findFirst({
            where: {
              companyId,
              rfqNumber
            }
          })
          
          if (!rfq) {
            console.log(`RFQ ${rfqNumber} not found`)
            continue
          }
          
          // Check if vendor is part of this RFQ
          const rfqVendor = await prisma.rFQVendor.findFirst({
            where: {
              rfqId: rfq.id,
              vendorId: vendor.id
            }
          })
          
          if (!rfqVendor) {
            console.log(`Vendor ${vendor.name} not part of RFQ ${rfqNumber}`)
            continue
          }
          
          // Process the email
          const result = await this.processVendorResponse(email, rfq, vendor)
          results.push(result)
          
          // Mark email as read
          await multiTenantGmail.markAsRead(companyId, email.id)
          
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error)
          results.push({
            emailId: email.id,
            success: false,
            error: error.message
          })
        }
      }
      
      return {
        success: true,
        processed: results.length,
        results
      }
    } catch (error) {
      console.error('Error processing RFQ emails:', error)
      throw error
    }
  }
  
  /**
   * Process a vendor response email
   */
  private async processVendorResponse(email: any, rfq: any, vendor: any) {
    // Create email response record
    const emailResponse = await prisma.rFQEmailResponse.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor.id,
        emailId: email.id,
        fromEmail: email.from,
        subject: email.subject,
        body: email.body,
        attachments: JSON.stringify(email.attachments || []),
        receivedAt: new Date(email.date),
        processingStatus: 'processing'
      }
    })
    
    try {
      // Extract quotation data using AI
      const extractedData = await this.extractQuotationData(email, rfq)
      
      // Create quotation if data was extracted
      if (extractedData && extractedData.items && extractedData.items.length > 0) {
        const quotation = await this.createQuotationFromEmail(
          rfq,
          vendor,
          extractedData,
          email.id
        )
        
        // Update email response with quotation link
        await prisma.rFQEmailResponse.update({
          where: { id: emailResponse.id },
          data: {
            processedAt: new Date(),
            processingStatus: 'processed',
            extractedData: JSON.stringify(extractedData),
            quotationId: quotation.id
          }
        })
        
        // Update RFQ vendor status
        await prisma.rFQVendor.update({
          where: {
            rfqId_vendorId: {
              rfqId: rfq.id,
              vendorId: vendor.id
            }
          },
          data: {
            responseReceived: true,
            quotationReceivedAt: new Date()
          }
        })
        
        // Update communication thread
        await prisma.rFQCommunicationThread.update({
          where: {
            rfqId_vendorId: {
              rfqId: rfq.id,
              vendorId: vendor.id
            }
          },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date()
          }
        })
        
        // Send acknowledgment
        await this.sendQuotationAcknowledgment(rfq, vendor, quotation)
        
        return {
          emailId: email.id,
          success: true,
          action: 'quotation_created',
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber,
          vendorName: vendor.name
        }
      } else {
        // No quotation data found, mark as pending manual review
        await prisma.rFQEmailResponse.update({
          where: { id: emailResponse.id },
          data: {
            processedAt: new Date(),
            processingStatus: 'pending_review',
            extractedData: JSON.stringify({ message: 'No quotation data found' })
          }
        })
        
        return {
          emailId: email.id,
          success: true,
          action: 'manual_review_required',
          vendorName: vendor.name,
          reason: 'No quotation data extracted'
        }
      }
    } catch (error) {
      // Update email response with error
      await prisma.rFQEmailResponse.update({
        where: { id: emailResponse.id },
        data: {
          processingStatus: 'failed',
          extractedData: JSON.stringify({ error: error.message })
        }
      })
      
      throw error
    }
  }
  
  /**
   * Extract RFQ number from email
   */
  private extractRFQNumber(subject: string, body: string): string | null {
    // Try to extract from subject first
    const subjectMatch = subject.match(/RFQ[- ]?(\w+)/i)
    if (subjectMatch) {
      return subjectMatch[1]
    }
    
    // Try to extract from body
    const bodyMatch = body.match(/RFQ[- ]?(\w+)/i)
    if (bodyMatch) {
      return bodyMatch[1]
    }
    
    return null
  }
  
  /**
   * Extract quotation data using AI
   */
  private async extractQuotationData(email: any, rfq: any) {
    const gemini = this.getGemini()
    if (!gemini) {
      // Fallback to basic extraction
      return this.basicQuotationExtraction(email)
    }
    
    const prompt = `Extract quotation details from this vendor email response to RFQ ${rfq.rfqNumber}:

Subject: ${email.subject}
Body: ${email.body}

RFQ Items requested:
${rfq.items.map(item => `- ${item.itemCode}: ${item.itemDescription} - Qty: ${item.quantity} ${item.unit}`).join('\n')}

Extract:
1. Item-wise pricing with item code, description, quantity, unit price, total
2. Payment terms
3. Delivery terms
4. Validity period
5. Any special conditions
6. Total amount including taxes

Return as JSON with structure:
{
  "items": [
    {
      "itemCode": "string",
      "itemDescription": "string", 
      "quantity": number,
      "unit": "string",
      "unitPrice": number,
      "totalAmount": number,
      "deliveryDays": number,
      "warranty": "string"
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "totalAmount": number,
  "paymentTerms": "string",
  "deliveryTerms": "string",
  "validityDays": number,
  "specialConditions": "string"
}`
    
    try {
      const response = await gemini.generateResponse(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('AI extraction failed:', error)
      return this.basicQuotationExtraction(email)
    }
  }
  
  /**
   * Basic quotation extraction without AI
   */
  private basicQuotationExtraction(email: any) {
    // Try to find price patterns in email
    const priceMatches = email.body.match(/₹\s*([\d,]+(?:\.\d{2})?)/g) || []
    const prices = priceMatches.map(p => parseFloat(p.replace(/[₹,]/g, '')))
    
    if (prices.length === 0) {
      return null
    }
    
    // Basic extraction
    return {
      items: [{
        itemDescription: 'Quotation items',
        quantity: 1,
        unit: 'LOT',
        unitPrice: Math.max(...prices),
        totalAmount: Math.max(...prices)
      }],
      totalAmount: Math.max(...prices),
      paymentTerms: 'As per email',
      deliveryTerms: 'As per email',
      validityDays: 30
    }
  }
  
  /**
   * Create quotation from extracted data
   */
  private async createQuotationFromEmail(rfq: any, vendor: any, data: any, emailId: string) {
    // Generate quotation number
    const quotationNumber = await this.generateQuotationNumber(rfq.companyId)
    
    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        companyId: rfq.companyId,
        quotationNumber,
        rfqId: rfq.id,
        vendorId: vendor.id,
        quotationDate: new Date(),
        validUntil: new Date(Date.now() + (data.validityDays || 30) * 24 * 60 * 60 * 1000),
        subtotal: data.subtotal || data.totalAmount || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        paymentTerms: data.paymentTerms || vendor.paymentTerms || '30 days',
        deliveryTerms: data.deliveryTerms || 'Ex-Works',
        warrantyTerms: data.warrantyTerms,
        status: 'received',
        emailId: emailId,
        notes: `Auto-processed from email response to RFQ ${rfq.rfqNumber}`
      }
    })
    
    // Create quotation items
    if (data.items && data.items.length > 0) {
      await prisma.quotationItem.createMany({
        data: data.items.map(item => ({
          quotationId: quotation.id,
          itemCode: item.itemCode,
          itemName: item.itemDescription || item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount || (item.quantity * item.unitPrice),
          deliveryDays: item.deliveryDays,
          warranty: item.warranty
        }))
      })
    }
    
    return quotation
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
   * Send quotation acknowledgment
   */
  private async sendQuotationAcknowledgment(rfq: any, vendor: any, quotation: any) {
    const emailBody = `
Dear ${vendor.contactPerson || vendor.name},

Thank you for your quotation ${quotation.quotationNumber} in response to our RFQ ${rfq.rfqNumber}.

We have received your quotation dated ${quotation.quotationDate.toLocaleDateString()} for ₹${quotation.totalAmount.toLocaleString()}.

Your quotation is currently under review. We will contact you if we need any clarifications.

Quotation Summary:
- Quotation Number: ${quotation.quotationNumber}
- RFQ Number: ${rfq.rfqNumber}
- Total Amount: ₹${quotation.totalAmount.toLocaleString()}
- Validity: Until ${quotation.validUntil.toLocaleDateString()}

Best regards,
Procurement Team
${rfq.company.name}
    `
    
    try {
      const result = await multiTenantGmail.sendEmail(
        rfq.companyId,
        vendor.email,
        `RE: Quotation Received - ${quotation.quotationNumber} for RFQ ${rfq.rfqNumber}`,
        emailBody
      )
      
      // Log the acknowledgment email
      await prisma.rFQEmailLog.create({
        data: {
          rfqId: rfq.id,
          vendorId: vendor.id,
          emailType: 'quotation_acknowledgment',
          emailId: result.messageId,
          subject: `RE: Quotation Received - ${quotation.quotationNumber}`,
          toEmail: vendor.email,
          status: 'sent',
          sentAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to send quotation acknowledgment:', error)
    }
  }
  
  /**
   * Check for RFQ response reminders
   */
  async sendRFQReminders(companyId: string) {
    try {
      // Find RFQs with pending responses past deadline
      const overdueRFQs = await prisma.rFQ.findMany({
        where: {
          companyId,
          status: 'sent',
          submissionDeadline: { lt: new Date() }
        },
        include: {
          vendors: {
            where: {
              responseReceived: false,
              reminderCount: { lt: 3 } // Max 3 reminders
            },
            include: {
              vendor: true
            }
          },
          company: true
        }
      })
      
      const results = []
      
      for (const rfq of overdueRFQs) {
        for (const rfqVendor of rfq.vendors) {
          // Check if reminder was sent recently (within 3 days)
          if (rfqVendor.lastReminderAt && 
              (new Date().getTime() - rfqVendor.lastReminderAt.getTime()) < 3 * 24 * 60 * 60 * 1000) {
            continue
          }
          
          try {
            // Send reminder email
            const emailBody = `
Dear ${rfqVendor.vendor.contactPerson || rfqVendor.vendor.name},

This is a gentle reminder regarding our RFQ ${rfq.rfqNumber} sent on ${rfq.issueDate.toLocaleDateString()}.

The submission deadline was ${rfq.submissionDeadline.toLocaleDateString()} and we haven't received your quotation yet.

If you have already sent your quotation, please ignore this reminder. If you need any clarification or additional time, please let us know.

We value your partnership and look forward to receiving your competitive quotation.

Best regards,
Procurement Team
${rfq.company.name}
            `
            
            const result = await multiTenantGmail.sendEmail(
              companyId,
              rfqVendor.vendor.email,
              `Reminder: RFQ ${rfq.rfqNumber} - Response Pending`,
              emailBody
            )
            
            // Log reminder
            await prisma.rFQEmailLog.create({
              data: {
                rfqId: rfq.id,
                vendorId: rfqVendor.vendor.id,
                emailType: 'reminder',
                emailId: result.messageId,
                subject: `Reminder: RFQ ${rfq.rfqNumber} - Response Pending`,
                toEmail: rfqVendor.vendor.email,
                status: 'sent',
                sentAt: new Date()
              }
            })
            
            // Update reminder count
            await prisma.rFQVendor.update({
              where: { id: rfqVendor.id },
              data: {
                reminderCount: { increment: 1 },
                lastReminderAt: new Date()
              }
            })
            
            results.push({
              rfqNumber: rfq.rfqNumber,
              vendorName: rfqVendor.vendor.name,
              reminderCount: rfqVendor.reminderCount + 1,
              success: true
            })
          } catch (error) {
            console.error(`Failed to send reminder to ${rfqVendor.vendor.name}:`, error)
            results.push({
              rfqNumber: rfq.rfqNumber,
              vendorName: rfqVendor.vendor.name,
              success: false,
              error: error.message
            })
          }
        }
      }
      
      return {
        success: true,
        reminders: results
      }
    } catch (error) {
      console.error('Error sending RFQ reminders:', error)
      throw error
    }
  }
}

export const rfqEmailProcessor = new RFQEmailProcessor()