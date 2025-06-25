import { prisma } from '../lib/prisma.js'

export class RFQPDFGenerator {
  /**
   * Generate RFQ as formatted text (temporary solution)
   */
  async generateRFQPDF(rfqId: string): Promise<Buffer> {
    // Fetch RFQ data with all relations
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        company: true,
        factory: true,
        requisition: {
          include: {
            division: true,
            department: true,
          }
        },
        items: {
          include: {
            material: {
              include: {
                uom: true
              }
            }
          }
        },
        vendors: {
          include: {
            vendor: true
          }
        }
      }
    })

    if (!rfq) {
      throw new Error('RFQ not found')
    }

    // Create formatted text that looks like a letterhead
    const separator = '═'.repeat(80)
    const thinSeparator = '─'.repeat(80)
    
    let content = `
${separator}
                    MAHAKAUSHAL SUGAR AND POWER INDUSTRIES LTD.
${thinSeparator}
              CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1
         Regd off : SF-11, Second Floor, Aakriti Business Center, 
                    Aakriti Eco city, Bawadiya Kalan, Bhopal-462039
         Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001
                E-mail : mspil.acc@gmail.com | mspil.power@gmail.com
${separator}

                              REQUEST FOR QUOTATION

RFQ No.: ${rfq.rfqNumber}                                    Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}

Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

To:
[Vendor Name]
[Vendor Address]

Dear Sir/Madam,

We invite you to submit your quotation for the following items as per the details given below:

${thinSeparator}
S.No. | Item Code      | Description                          | Qty    | Unit  | Req. Date
${thinSeparator}
`

    // Add items
    rfq.items.forEach((item, index) => {
      const sno = String(index + 1).padEnd(5)
      const code = (item.itemCode || item.material?.code || '').padEnd(14)
      const desc = (item.itemDescription || item.material?.name || '').substring(0, 35).padEnd(36)
      const qty = String(item.quantity).padEnd(6)
      const unit = (item.unit || item.material?.uom?.code || 'NOS').padEnd(5)
      const date = new Date(item.requiredDate).toLocaleDateString('en-IN')
      
      content += `${sno} | ${code} | ${desc} | ${qty} | ${unit} | ${date}\n`
      
      if (item.specifications) {
        content += `      | Specifications: ${item.specifications}\n`
      }
    })

    content += `${thinSeparator}

TERMS & CONDITIONS:
1. Delivery Terms: ${rfq.deliveryTerms}
2. Payment Terms: ${rfq.paymentTerms}
3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}
4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation
5. Prices should be inclusive of all taxes and duties
6. Please mention HSN/SAC code against each item
7. Quotation should reach us on or before the due date mentioned above
`

    if (rfq.specialInstructions) {
      content += `
SPECIAL INSTRUCTIONS:
${rfq.specialInstructions}
`
    }

    content += `

Thanking you,

Yours faithfully,
For Mahakaushal Sugar and Power Industries Ltd.



_______________________
Authorized Signatory

${separator}
`

    // Convert to buffer
    return Buffer.from(content, 'utf-8')
  }

  /**
   * Generate vendor-specific RFQ PDF
   */
  async generateVendorRFQPDF(rfqId: string, vendorId: string): Promise<Buffer> {
    // Fetch RFQ data
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        company: true,
        factory: true,
        requisition: {
          include: {
            division: true,
            department: true,
          }
        },
        items: {
          include: {
            material: {
              include: {
                uom: true
              }
            }
          }
        },
      }
    })

    if (!rfq) {
      throw new Error('RFQ not found')
    }

    // Fetch specific vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Create formatted text
    const separator = '═'.repeat(80)
    const thinSeparator = '─'.repeat(80)
    
    let content = `
${separator}
                    MAHAKAUSHAL SUGAR AND POWER INDUSTRIES LTD.
${thinSeparator}
              CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1
         Regd off : SF-11, Second Floor, Aakriti Business Center, 
                    Aakriti Eco city, Bawadiya Kalan, Bhopal-462039
         Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001
                E-mail : mspil.acc@gmail.com | mspil.power@gmail.com
${separator}

                              REQUEST FOR QUOTATION

RFQ No.: ${rfq.rfqNumber}                                    Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}

Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

To:
${vendor.name}
${vendor.addressLine1 || ''}
${vendor.addressLine2 ? vendor.addressLine2 + '\n' : ''}${vendor.city}, ${vendor.state} - ${vendor.pincode}
${vendor.email ? 'Email: ' + vendor.email : ''}
${vendor.phone ? 'Phone: ' + vendor.phone : ''}

Dear Sir/Madam,

We invite you to submit your quotation for the following items as per the details given below:

${thinSeparator}
S.No. | Item Code      | Description                          | Qty    | Unit  | Req. Date
${thinSeparator}
`

    // Add items
    rfq.items.forEach((item, index) => {
      const sno = String(index + 1).padEnd(5)
      const code = (item.itemCode || item.material?.code || '').padEnd(14)
      const desc = (item.itemDescription || item.material?.name || '').substring(0, 35).padEnd(36)
      const qty = String(item.quantity).padEnd(6)
      const unit = (item.unit || item.material?.uom?.code || 'NOS').padEnd(5)
      const date = new Date(item.requiredDate).toLocaleDateString('en-IN')
      
      content += `${sno} | ${code} | ${desc} | ${qty} | ${unit} | ${date}\n`
      
      if (item.specifications) {
        content += `      | Specifications: ${item.specifications}\n`
      }
    })

    content += `${thinSeparator}

TERMS & CONDITIONS:
1. Delivery Terms: ${rfq.deliveryTerms}
2. Payment Terms: ${rfq.paymentTerms}
3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}
4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation
5. Prices should be inclusive of all taxes and duties
6. Please mention HSN/SAC code against each item
7. Quotation should reach us on or before the due date mentioned above
8. Please send your quotation to: mspil.acc@gmail.com
`

    if (rfq.specialInstructions) {
      content += `
SPECIAL INSTRUCTIONS:
${rfq.specialInstructions}
`
    }

    content += `

Thanking you,

Yours faithfully,
For Mahakaushal Sugar and Power Industries Ltd.



_______________________
Authorized Signatory

${separator}
`

    // Convert to buffer
    return Buffer.from(content, 'utf-8')
  }

  /**
   * Generate and save RFQ PDF
   */
  async generateAndSaveRFQ(rfqId: string): Promise<{ buffer: Buffer; filename: string }> {
    const buffer = await this.generateRFQPDF(rfqId)
    
    // Get RFQ number for filename
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      select: { rfqNumber: true }
    })

    const filename = `RFQ_${rfq?.rfqNumber}_${new Date().getTime()}`

    return { buffer, filename }
  }
}

// Export singleton instance
export const rfqPDFGenerator = new RFQPDFGenerator()