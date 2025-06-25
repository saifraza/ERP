import { prisma } from '../lib/prisma.js'

export class RFQPDFGenerator {
  /**
   * Generate RFQ PDF
   */
  async generateRFQPDF(rfqId: string): Promise<Buffer> {
    // Fetch RFQ data with all relations
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        company: true,
        requisition: {
          include: {
            division: true,
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

    // For now, return a simple placeholder buffer
    // TODO: Implement proper PDF generation
    const pdfContent = `
REQUEST FOR QUOTATION

RFQ Number: ${rfq.rfqNumber}
Issue Date: ${new Date(rfq.issueDate).toLocaleDateString()}
Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString()}

Company: ${rfq.company.name}
${rfq.company.addressLine1}
${rfq.company.city}, ${rfq.company.state} - ${rfq.company.pincode}

Items:
${rfq.items.map((item, index) => `
${index + 1}. ${item.material?.name || 'Item'}
   Quantity: ${item.quantity} ${item.material?.uom?.code || 'NOS'}
   Required Date: ${new Date(item.requiredDate).toLocaleDateString()}
`).join('')}

Terms & Conditions:
- Payment Terms: ${rfq.paymentTerms}
- Delivery Terms: ${rfq.deliveryTerms}
- Validity: ${rfq.quotationValidityDays} days
    `.trim()

    // Convert to buffer
    return Buffer.from(pdfContent, 'utf-8')
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

    const filename = `RFQ_${rfq?.rfqNumber}_${new Date().getTime()}.pdf`

    return { buffer, filename }
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
        requisition: {
          include: {
            division: true,
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

    // For now, return a simple placeholder buffer with vendor info
    const pdfContent = `
REQUEST FOR QUOTATION

To: ${vendor.name}
${vendor.addressLine1}
${vendor.city}, ${vendor.state} - ${vendor.pincode}

RFQ Number: ${rfq.rfqNumber}
Issue Date: ${new Date(rfq.issueDate).toLocaleDateString()}
Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString()}

From: ${rfq.company.name}
${rfq.company.addressLine1}
${rfq.company.city}, ${rfq.company.state} - ${rfq.company.pincode}

Items:
${rfq.items.map((item, index) => `
${index + 1}. ${item.material?.name || 'Item'}
   Quantity: ${item.quantity} ${item.material?.uom?.code || 'NOS'}
   Required Date: ${new Date(item.requiredDate).toLocaleDateString()}
   ${item.specifications ? `Specifications: ${item.specifications}` : ''}
`).join('')}

Terms & Conditions:
- Payment Terms: ${rfq.paymentTerms}
- Delivery Terms: ${rfq.deliveryTerms}
- Validity: ${rfq.quotationValidityDays} days

Please submit your quotation before the due date.
    `.trim()

    // Convert to buffer
    return Buffer.from(pdfContent, 'utf-8')
  }
}

// Export singleton instance
export const rfqPDFGenerator = new RFQPDFGenerator()