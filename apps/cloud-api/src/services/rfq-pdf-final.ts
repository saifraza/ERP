import { prisma } from '../lib/prisma.js'
let PDFDocument: any

async function getPDFDocument() {
  if (!PDFDocument) {
    const pdfkit = await import('pdfkit')
    PDFDocument = pdfkit.default || pdfkit
  }
  return PDFDocument
}

export class RFQPDFFinal {
  async generateRFQPDF(rfqId: string): Promise<Buffer> {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        company: true,
        factory: true,
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

    return new Promise(async (resolve, reject) => {
      try {
        const PDFDoc = await getPDFDocument()
        const doc = new PDFDoc({
          size: 'A4',
          margin: 50
        })

        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Simple header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('MAHAKAUSHAL SUGAR AND POWER INDUSTRIES LTD.', { align: 'center' })
           .fontSize(10)
           .font('Helvetica')
           .text('Village Bachai, Dist. Narsinghpur (M.P.) - 487001', { align: 'center' })
           .text('Email: procurement@mspil.com | Phone: +91 9131489373', { align: 'center' })
           .moveDown(2)

        // Title
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('REQUEST FOR QUOTATION', { align: 'center' })
           .moveDown()

        // RFQ Details
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('RFQ Number: ', { continued: true })
           .font('Helvetica')
           .text(rfq.rfqNumber)
           
        doc.font('Helvetica-Bold')
           .text('Issue Date: ', { continued: true })
           .font('Helvetica')
           .text(new Date(rfq.issueDate).toLocaleDateString('en-IN'))
           
        doc.font('Helvetica-Bold')
           .text('Due Date: ', { continued: true })
           .font('Helvetica')
           .text(new Date(rfq.submissionDeadline).toLocaleDateString('en-IN'))
           
        doc.font('Helvetica-Bold')
           .text('Division: ', { continued: true })
           .font('Helvetica')
           .text(rfq.requisition?.division?.name || 'General')
           .moveDown(2)

        // Items
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('ITEMS REQUIRED:')
           .moveDown()

        // Simple table
        doc.fontSize(10)
        rfq.items.forEach((item, index) => {
          doc.font('Helvetica-Bold')
             .text(`${index + 1}. ${item.itemDescription || item.material?.description || 'Item'}`)
          doc.font('Helvetica')
             .text(`   Quantity: ${item.quantity} ${item.unit || item.material?.uom?.code || 'Unit'}`)
          if (item.specification) {
            doc.text(`   Specification: ${item.specification}`)
          }
          doc.moveDown(0.5)
        })

        // Terms
        doc.moveDown()
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('TERMS & CONDITIONS:')
           .fontSize(10)
           .font('Helvetica')
           .moveDown(0.5)

        const terms = [
          'Prices should be inclusive of all taxes (GST to be shown separately)',
          'Quotation should be valid for minimum 90 days',
          'Please mention HSN/SAC code for each item',
          'Payment Terms: As per company policy',
          'Delivery Terms: Ex-Works',
          `Submit quotation before: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')}`
        ]

        terms.forEach((term, index) => {
          doc.text(`${index + 1}. ${term}`)
        })

        // Footer
        doc.moveDown(3)
           .text('For Mahakaushal Sugar and Power Industries Ltd.')
           .moveDown(3)
           .text('Authorized Signatory', { align: 'right' })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  async generateVendorRFQPDF(rfqId: string, vendorId: string): Promise<Buffer> {
    // For now, just use the same PDF
    return this.generateRFQPDF(rfqId)
  }
}

export const rfqPDFFinal = new RFQPDFFinal()