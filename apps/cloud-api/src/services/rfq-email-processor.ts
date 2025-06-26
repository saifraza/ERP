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
      console.log(`Processing RFQ emails for company: ${companyId}`)
      
      // Fetch unread emails with RFQ-related subjects
      // Include common reply prefixes and quotation terms
      const emails = await multiTenantGmail.listEmails(
        companyId, 
        50,
        'is:unread (subject:(RFQ OR "Request for Quotation" OR Quotation OR Quote OR "Price Quote" OR "RE: RFQ" OR "Re: RFQ"))'
      )
      
      console.log(`Found ${emails.length} unread RFQ-related emails`)
      
      const results = []
      
      for (const email of emails) {
        console.log(`\n=== Processing email ===`)
        console.log(`Subject: ${email.subject}`)
        console.log(`From: ${email.from}`)
        
        try {
          // Extract email address from sender
          const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from
          console.log(`Extracted email address: ${senderEmail}`)
          
          // Check if email is from a vendor - handle multiple vendors with same email
          // First check primary email field
          let vendors = await prisma.vendor.findMany({
            where: {
              companyId,
              email: senderEmail
            }
          })
          
          // If not found in primary email, check VendorEmail table if it exists
          if (vendors.length === 0) {
            try {
              // Check if VendorEmail table exists and search there
              const vendorEmails = await prisma.$queryRaw`
                SELECT DISTINCT v.* 
                FROM "Vendor" v
                INNER JOIN "VendorEmail" ve ON v.id = ve."vendorId"
                WHERE v."companyId" = ${companyId} 
                AND ve."email" = ${senderEmail}
                AND ve."isActive" = true
              ` as any[]
              
              if (vendorEmails.length > 0) {
                console.log(`Found vendor(s) via VendorEmail table`)
                vendors = vendorEmails
              }
            } catch (e) {
              // VendorEmail table might not exist yet, that's ok
              console.log(`VendorEmail table not available`)
            }
          }
          
          if (vendors.length === 0) {
            console.log(`Email from non-vendor: ${senderEmail}`)
            console.log(`Checking all vendors in company...`)
            const allVendors = await prisma.vendor.findMany({
              where: { companyId },
              select: { email: true, name: true }
            })
            console.log(`Company has ${allVendors.length} vendors:`)
            allVendors.forEach(v => console.log(`  - ${v.name}: ${v.email}`))
            
            results.push({
              emailId: email.id,
              success: false,
              reason: 'not_a_vendor',
              senderEmail,
              subject: email.subject,
              suggestion: 'Consider adding this email as an alternate email for the vendor'
            })
            continue
          }
          
          console.log(`Found ${vendors.length} vendor(s) with email ${senderEmail}:`)
          vendors.forEach(v => console.log(`  - ${v.name} (ID: ${v.id})`))
          
          // We'll try to match this email to the correct vendor based on RFQ assignment
          
          // Get full email content
          const fullEmail = await multiTenantGmail.getEmailContent(companyId, email.id)
          
          // Check if this is a response to an RFQ
          const rfqNumber = this.extractRFQNumber(email.subject, fullEmail.textBody || fullEmail.htmlBody || '')
          console.log(`Extracted RFQ number: ${rfqNumber}`)
          
          if (!rfqNumber) {
            console.log(`No RFQ number found in email from ${vendor.name}`)
            console.log(`Subject: ${email.subject}`)
            console.log(`Body preview: ${(fullEmail.textBody || fullEmail.htmlBody || '').substring(0, 200)}...`)
            
            results.push({
              emailId: email.id,
              success: false,
              reason: 'no_rfq_number',
              vendorName: vendor.name,
              subject: email.subject
            })
            continue
          }
          
          // Find the RFQ
          // First try exact match
          let rfq = await prisma.rFQ.findFirst({
            where: {
              companyId,
              rfqNumber
            }
          })
          
          // If not found and rfqNumber doesn't start with "RFQ", try adding prefix
          if (!rfq && !rfqNumber.toUpperCase().startsWith('RFQ')) {
            rfq = await prisma.rFQ.findFirst({
              where: {
                companyId,
                rfqNumber: `RFQ-${rfqNumber}`
              }
            })
          }
          
          if (!rfq) {
            console.log(`RFQ ${rfqNumber} not found in database`)
            console.log(`Checking all RFQs in company...`)
            const allRFQs = await prisma.rFQ.findMany({
              where: { companyId },
              select: { rfqNumber: true, status: true }
            })
            console.log(`Company has ${allRFQs.length} RFQs:`)
            allRFQs.forEach(r => console.log(`  - ${r.rfqNumber} (${r.status})`))
            
            results.push({
              emailId: email.id,
              success: false,
              reason: 'rfq_not_found',
              rfqNumber,
              vendorName: vendor.name,
              subject: email.subject
            })
            continue
          }
          
          console.log(`Found RFQ: ${rfq.rfqNumber} (Status: ${rfq.status})`)
          
          // Find which vendor(s) from the email are part of this RFQ
          const rfqVendors = await prisma.rFQVendor.findMany({
            where: {
              rfqId: rfq.id,
              vendorId: {
                in: vendors.map(v => v.id)
              }
            },
            include: {
              vendor: true
            }
          })
          
          if (rfqVendors.length === 0) {
            console.log(`None of the vendors with email ${senderEmail} are part of RFQ ${rfqNumber}`)
            console.log(`Vendors with this email:`)
            vendors.forEach(v => console.log(`  - ${v.name} (${v.id})`))
            
            console.log(`Checking all vendors assigned to this RFQ...`)
            const allRfqVendors = await prisma.rFQVendor.findMany({
              where: { rfqId: rfq.id },
              include: { vendor: { select: { name: true, email: true } } }
            })
            console.log(`RFQ has ${allRfqVendors.length} assigned vendors:`)
            allRfqVendors.forEach(rv => console.log(`  - ${rv.vendor.name} (${rv.vendor.email})`))
            
            // Check if this might be a reply from a different email of an assigned vendor
            // In real world, vendor might use personal email, company email, etc.
            console.log(`\nChecking for potential vendor matches...`)
            
            // 1. Check by sender name
            const senderName = email.from.match(/^([^<]+)/)?.[1]?.trim() || ''
            const matchingVendorByName = allRfqVendors.find(rv => 
              rv.vendor.name.toLowerCase().includes(senderName.toLowerCase()) ||
              senderName.toLowerCase().includes(rv.vendor.name.toLowerCase())
            )
            
            if (matchingVendorByName) {
              console.log(`Found potential match by name: ${matchingVendorByName.vendor.name}`)
              console.log(`Consider adding ${senderEmail} as an alternate email for this vendor`)
            }
            
            // 2. Check by email domain
            const senderDomain = senderEmail.split('@')[1]
            const matchingVendorByDomain = allRfqVendors.find(rv => {
              if (!rv.vendor.email) return false
              const vendorDomain = rv.vendor.email.split('@')[1]
              return vendorDomain === senderDomain
            })
            
            if (matchingVendorByDomain && !matchingVendorByName) {
              console.log(`Found potential match by email domain: ${matchingVendorByDomain.vendor.name}`)
              console.log(`Both emails use domain: @${senderDomain}`)
              console.log(`Consider adding ${senderEmail} as an alternate email for this vendor`)
            }
            
            // 3. Check if it's a common personal email replying for a company
            const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com']
            if (personalDomains.includes(senderDomain)) {
              console.log(`Note: Reply from personal email domain (@${senderDomain})`)
              console.log(`This is common when vendor staff use personal emails for business`)
            }
            
            results.push({
              emailId: email.id,
              success: false,
              reason: 'vendor_not_in_rfq',
              rfqNumber: rfq.rfqNumber,
              vendorEmail: senderEmail,
              vendorsWithEmail: vendors.map(v => v.name),
              subject: email.subject
            })
            continue
          }
          
          // If multiple vendors with same email are part of this RFQ, use the first one
          // In real world, this should be rare but we handle it gracefully
          const vendor = rfqVendors[0].vendor
          console.log(`Processing response from vendor: ${vendor.name} (ID: ${vendor.id}) for RFQ ${rfq.rfqNumber}`)
          
          // Process the email
          const result = await this.processVendorResponse(email, fullEmail, rfq, vendor)
          results.push(result)
          
          // Mark email as read after successful processing
          try {
            await multiTenantGmail.markAsRead(companyId, email.id)
          } catch (error) {
            console.warn(`Failed to mark email ${email.id} as read:`, error)
            // Don't fail the entire process if marking as read fails
          }
          
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error)
          results.push({
            emailId: email.id,
            success: false,
            error: error.message
          })
        }
      }
      
      // Summarize results
      const summary = {
        totalEmails: emails.length,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        quotationsCreated: results.filter(r => r.action === 'quotation_created').length,
        manualReviewRequired: results.filter(r => r.action === 'manual_review_required').length,
        failed: results.filter(r => r.success === false).length
      }
      
      console.log('RFQ Email Processing Summary:', summary)
      
      return {
        success: true,
        processed: results.length,
        results,
        summary,
        debug: {
          totalEmailsFound: emails.length,
          failureReasons: {
            notAVendor: results.filter(r => r.reason === 'not_a_vendor').length,
            noRfqNumber: results.filter(r => r.reason === 'no_rfq_number').length,
            rfqNotFound: results.filter(r => r.reason === 'rfq_not_found').length,
            vendorNotInRfq: results.filter(r => r.reason === 'vendor_not_in_rfq').length
          }
        }
      }
    } catch (error) {
      console.error('Error processing RFQ emails:', error)
      throw error
    }
  }
  
  /**
   * Process a vendor response email
   */
  private async processVendorResponse(email: any, fullEmail: any, rfq: any, vendor: any) {
    // Create email response record
    const emailResponse = await prisma.rFQEmailResponse.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor.id,
        emailId: email.id,
        fromEmail: email.from,
        subject: email.subject,
        body: fullEmail.textBody || fullEmail.htmlBody || '',
        attachments: JSON.stringify(fullEmail.attachments || []),
        receivedAt: new Date(email.date),
        processingStatus: 'processing'
      }
    })
    
    try {
      // Extract quotation data using AI
      const extractedData = await this.extractQuotationData(fullEmail, rfq)
      
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
    // Common RFQ number formats:
    // RFQ-2024-0001, RFQ 2024-0001, RFQ2024-0001, RFQ#2024-0001
    // Also match if in reply: Re: RFQ-2024-0001, RE: Your RFQ 2024-0001
    
    const patterns = [
      /RFQ[-#\s]*([\d]{4}[-\s]*\d{4})/i,  // RFQ-2024-0001 format
      /RFQ[-#\s]*(\w+-\d+)/i,              // RFQ-XXXX-001 format
      /RFQ[-#\s]*([\w\d]+)/i,              // RFQ123 or RFQABC123 format
    ]
    
    // Try to extract from subject first (more reliable)
    for (const pattern of patterns) {
      const subjectMatch = subject.match(pattern)
      if (subjectMatch) {
        // Clean up the extracted number (remove spaces)
        return subjectMatch[1].replace(/\s+/g, '-')
      }
    }
    
    // Try to extract from body
    for (const pattern of patterns) {
      const bodyMatch = body.match(pattern)
      if (bodyMatch) {
        // Clean up the extracted number (remove spaces)
        return bodyMatch[1].replace(/\s+/g, '-')
      }
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
Body: ${email.textBody || email.htmlBody || ''}

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
    const emailContent = email.textBody || email.htmlBody || ''
    const priceMatches = emailContent.match(/₹\s*([\d,]+(?:\.\d{2})?)/g) || []
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