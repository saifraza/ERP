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
          margin: 40,
          bufferPages: true
        })

        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Header with company letterhead matching the official design
        // Light green header background like in the letterhead
        doc.rect(0, 0, doc.page.width, 130)
           .fill('#a4c639') // Light green background
           
        // Company title
        doc.font('Helvetica-Bold')
           .fontSize(24)
           .fillColor('#2d4a2b') // Dark green text
           .text('Mahakaushal Sugar and Power Industries Ltd.', 0, 25, {
             align: 'center',
             width: doc.page.width
           })
           
        // Company details in smaller font
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#2d4a2b')
           .text('CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1', 0, 55, {
             align: 'center',
             width: doc.page.width
           })
           
        doc.fontSize(9)
           .text('Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,', 0, 72, {
             align: 'center',
             width: doc.page.width
           })
           .text('Bawadiya Kalan, Bhopal-462039', 0, 86, {
             align: 'center',
             width: doc.page.width
           })
           
        doc.font('Helvetica-Bold')
           .text('Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001', 0, 100, {
             align: 'center',
             width: doc.page.width
           })
           
        doc.font('Helvetica')
           .text('E-mail : mspil.acc@gmail.com | mspil.power@gmail.com', 0, 114, {
             align: 'center',
             width: doc.page.width
           })
           
        // Add subtle watermark
        doc.save()
        doc.opacity(0.05)
        doc.fontSize(60)
           .fillColor('#a4c639')
           .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
           .text('MSPIL', doc.page.width / 2 - 100, doc.page.height / 2 - 30)
        doc.restore()
           
        // Reset to black text
        doc.fillColor('#000000')
        doc.y = 140

        // Title
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#2d4a2b') // Dark green to match letterhead
           .text('REQUEST FOR QUOTATION', { align: 'center' })
           
        // Underline
        const titleY = doc.y
        doc.moveTo(doc.page.width / 2 - 100, titleY)
           .lineTo(doc.page.width / 2 + 100, titleY)
           .strokeColor('#a4c639') // Light green
           .lineWidth(2)
           .stroke()
           .moveDown()

        // RFQ Details in a box
        const detailsY = doc.y + 10
        doc.rect(40, detailsY, doc.page.width - 80, 80)
           .strokeColor('#e5e7eb')
           .lineWidth(1)
           .stroke()
           
        doc.fillColor('#000000')
        doc.y = detailsY + 10
        
        // Left column
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('RFQ Number:', 50, doc.y)
           .font('Helvetica')
           .fillColor('#374151')
           .text(rfq.rfqNumber, 140, doc.y - 10)
           
        doc.font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('Issue Date:', 50, doc.y + 5)
           .font('Helvetica')
           .fillColor('#374151')
           .text(new Date(rfq.issueDate).toLocaleDateString('en-IN'), 140, doc.y - 10)
           
        // Right column
        doc.font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('Due Date:', 300, detailsY + 10)
           .font('Helvetica')
           .fillColor('#374151')
           .text(new Date(rfq.submissionDeadline).toLocaleDateString('en-IN'), 380, detailsY + 10)
           
        doc.font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('Division:', 300, detailsY + 25)
           .font('Helvetica')
           .fillColor('#374151')
           .text(rfq.requisition?.division?.name || 'General', 380, detailsY + 25)
           
        // Delivery info
        doc.font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('Delivery Terms:', 50, detailsY + 45)
           .font('Helvetica')
           .fillColor('#374151')
           .text(rfq.deliveryTerms || 'Ex-Works', 140, detailsY + 45)
           
        doc.font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('Payment Terms:', 300, detailsY + 45)
           .font('Helvetica')
           .fillColor('#374151')
           .text(rfq.paymentTerms || 'As per company policy', 380, detailsY + 45)
           
        doc.y = detailsY + 90

        // Items section with table
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#2d4a2b')
           .text('ITEMS REQUIRED')
           .moveDown(0.5)
           
        // Table headers
        const tableTop = doc.y
        const colX = [50, 80, 280, 420, 480]
        const colHeaders = ['S.No', 'Item Description', 'Specification', 'Quantity', 'Unit']
        
        // Header background
        doc.rect(40, tableTop, doc.page.width - 80, 25)
           .fill('#e8f5e9') // Light green background
           
        // Header text
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#1f2937')
        colHeaders.forEach((header, i) => {
          doc.text(header, colX[i], tableTop + 8)
        })
        
        // Items rows
        let currentY = tableTop + 25
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#374151')
           
        rfq.items.forEach((item, index) => {
          // Alternate row background
          if (index % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 25)
               .fill('#f9fafb')
               .fillColor('#374151')
          }
          
          doc.text(`${index + 1}`, colX[0], currentY + 8)
             .text(item.itemDescription || item.material?.description || 'Item', colX[1], currentY + 8, {
               width: 190,
               height: 25,
               ellipsis: true
             })
             .text(item.specification || '-', colX[2], currentY + 8, {
               width: 130,
               height: 25,
               ellipsis: true
             })
             .text(item.quantity.toString(), colX[3], currentY + 8)
             .text(item.unit || item.material?.uom?.code || 'Unit', colX[4], currentY + 8)
             
          currentY += 25
        })
        
        // Table bottom border
        doc.moveTo(40, currentY)
           .lineTo(doc.page.width - 40, currentY)
           .strokeColor('#e5e7eb')
           .stroke()
           
        doc.y = currentY + 10

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

        // Footer section with signature area
        const footerY = doc.page.height - 120
        
        // Signature area background
        doc.rect(40, footerY, doc.page.width - 80, 60)
           .strokeColor('#e5e7eb')
           .lineWidth(1)
           .stroke()
           
        doc.fontSize(10)
           .fillColor('#1f2937')
           .text('For Mahakaushal Sugar and Power Industries Ltd.', 50, footerY + 10)
           
        doc.fontSize(9)
           .fillColor('#6b7280')
           .text('_______________________', doc.page.width - 200, footerY + 40)
           .text('Authorized Signatory', doc.page.width - 190, footerY + 45)
           
        // Add page number
        const range = doc.bufferedPageRange()
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i)
          
          // Footer line
          doc.moveTo(40, doc.page.height - 40)
             .lineTo(doc.page.width - 40, doc.page.height - 40)
             .strokeColor('#e5e7eb')
             .lineWidth(1)
             .stroke()
             
          doc.font('Helvetica')
             .fontSize(8)
             .fillColor('#6b7280')
             .text(
               `Page ${i + 1} of ${range.count} | RFQ: ${rfq.rfqNumber} | Generated on ${new Date().toLocaleDateString('en-IN')}`,
               40,
               doc.page.height - 30,
               { align: 'center', width: doc.page.width - 80 }
             )
        }

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