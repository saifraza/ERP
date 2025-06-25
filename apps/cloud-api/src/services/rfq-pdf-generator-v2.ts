import { prisma } from '../lib/prisma.js'
let PDFDocument: any

// Dynamic import for PDFKit to handle ESM/CJS compatibility
async function getPDFDocument() {
  if (!PDFDocument) {
    const pdfkit = await import('pdfkit')
    PDFDocument = pdfkit.default || pdfkit
  }
  return PDFDocument
}

export class RFQPDFGeneratorV2 {
  /**
   * Generate professional RFQ PDF with proper formatting
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
          bufferPages: true,
          info: {
            Title: `RFQ ${rfq.rfqNumber}`,
            Author: rfq.company.name,
            Subject: 'Request for Quotation',
            Keywords: 'RFQ, Quotation, Procurement'
          }
        })

        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Helper function for adding new pages with header
        const addNewPage = () => {
          doc.addPage()
          drawHeader()
        }

        // Draw header function
        const drawHeader = () => {
          // Header background
          doc.rect(0, 0, doc.page.width, 130)
             .fill('#f8f9fa')
          
          // Add company logo placeholder
          doc.rect(40, 20, 80, 80)
             .strokeColor('#dee2e6')
             .stroke()
          doc.fontSize(10)
             .fillColor('#6c757d')
             .text('LOGO', 40, 55, { width: 80, align: 'center' })
          
          // Company details
          doc.font('Helvetica-Bold')
             .fontSize(18)
             .fillColor('#2c3e50')
             .text('MAHAKAUSHAL SUGAR AND POWER INDUSTRIES LTD.', 140, 25)
          
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#495057')
             .text('CIN: U01543MP2005PLC017514 | GSTIN: 23AAECM3666P1Z1', 140, 50)
             .text('Regd. Office: SF-11, Aakriti Business Center, Bawadiya Kalan, Bhopal-462039', 140, 65)
             .text('Factory: Village Bachai, Dist. Narsinghpur (M.P.) - 487001', 140, 80)
             .text('Email: procurement@mspil.com | Phone: +91 9131489373', 140, 95)
          
          // Border line
          doc.moveTo(0, 130)
             .lineTo(doc.page.width, 130)
             .strokeColor('#2980b9')
             .lineWidth(2)
             .stroke()
        }

        // Start with header
        drawHeader()

        // Title
        doc.y = 150
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#2c3e50')
           .text('REQUEST FOR QUOTATION', {
             align: 'center',
             underline: true
           })

        // RFQ Info Box
        const infoBoxY = doc.y + 20
        doc.rect(40, infoBoxY, doc.page.width - 80, 100)
           .strokeColor('#dee2e6')
           .lineWidth(1)
           .stroke()

        // RFQ Details in two columns
        const leftCol = 60
        const rightCol = 320
        
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor('#495057')
           .text('RFQ Number:', leftCol, infoBoxY + 15)
           .text('Issue Date:', leftCol, infoBoxY + 35)
           .text('Due Date:', leftCol, infoBoxY + 55)
           .text('Priority:', leftCol, infoBoxY + 75)
           
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#212529')
           .text(rfq.rfqNumber, leftCol + 80, infoBoxY + 15)
           .text(new Date(rfq.issueDate).toLocaleDateString('en-IN'), leftCol + 80, infoBoxY + 35)
           .text(new Date(rfq.submissionDeadline).toLocaleDateString('en-IN'), leftCol + 80, infoBoxY + 55)
           .text(rfq.priority || 'Normal', leftCol + 80, infoBoxY + 75)
           
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor('#495057')
           .text('Division:', rightCol, infoBoxY + 15)
           .text('Factory:', rightCol, infoBoxY + 35)
           .text('Department:', rightCol, infoBoxY + 55)
           .text('Contact:', rightCol, infoBoxY + 75)
           
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#212529')
           .text(rfq.requisition?.division?.name || 'General', rightCol + 70, infoBoxY + 15)
           .text(rfq.factory?.name || 'Main', rightCol + 70, infoBoxY + 35)
           .text(rfq.requisition?.department || 'Procurement', rightCol + 70, infoBoxY + 55)
           .text(rfq.company.phone || '-', rightCol + 70, infoBoxY + 75)

        // Items Section
        doc.y = infoBoxY + 120
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#2c3e50')
           .text('ITEMS REQUIRED', 40)
           .moveDown(0.5)

        // Table setup
        const tableTop = doc.y
        const tableHeaders = ['S.No', 'Item Description', 'Specification', 'Qty', 'Unit', 'Delivery']
        const colWidths = [40, 200, 140, 50, 40, 60]
        const colX = [40, 80, 280, 420, 470, 510]

        // Draw table header
        doc.rect(40, tableTop, doc.page.width - 80, 25)
           .fill('#2980b9')

        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#ffffff')
        
        tableHeaders.forEach((header, i) => {
          doc.text(header, colX[i], tableTop + 8)
        })

        // Draw items
        let currentY = tableTop + 25
        const pageBottom = doc.page.height - 100

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#212529')

        rfq.items.forEach((item, index) => {
          // Check if we need a new page
          if (currentY + 30 > pageBottom) {
            addNewPage()
            currentY = 150
            
            // Redraw table header
            doc.rect(40, currentY, doc.page.width - 80, 25)
               .fill('#2980b9')
            
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .fillColor('#ffffff')
            
            tableHeaders.forEach((header, i) => {
              doc.text(header, colX[i], currentY + 8)
            })
            
            currentY += 25
            doc.font('Helvetica')
               .fontSize(9)
               .fillColor('#212529')
          }

          // Alternate row background
          if (index % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 25)
               .fill('#f8f9fa')
               .fillColor('#212529')
          }

          // Draw item data
          doc.text(`${index + 1}`, colX[0], currentY + 8)
             .text(item.itemDescription || item.material?.description || '', colX[1], currentY + 8, {
               width: colWidths[1] - 10,
               height: 25,
               ellipsis: true
             })
             .text(item.specification || '-', colX[2], currentY + 8, {
               width: colWidths[2] - 10,
               height: 25,
               ellipsis: true
             })
             .text(item.quantity.toString(), colX[3], currentY + 8)
             .text(item.unit || item.material?.uom?.code || '', colX[4], currentY + 8)
             .text(item.requiredDate ? new Date(item.requiredDate).toLocaleDateString('en-IN') : 'ASAP', colX[5], currentY + 8)

          currentY += 25
        })

        // Draw table bottom border
        doc.moveTo(40, currentY)
           .lineTo(doc.page.width - 40, currentY)
           .strokeColor('#dee2e6')
           .stroke()

        // Terms & Conditions
        if (currentY + 200 > pageBottom) {
          addNewPage()
          currentY = 150
        } else {
          currentY += 30
        }

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#2c3e50')
           .text('TERMS & CONDITIONS', 40, currentY)
           .moveDown(0.5)

        const terms = [
          `Payment Terms: ${rfq.paymentTerms || 'As per company policy'}`,
          `Delivery Terms: ${rfq.deliveryTerms || 'Ex-Works'}`,
          `Quotation Validity: Minimum ${rfq.quotationValidityDays || 90} days`,
          'Prices should be inclusive of all taxes (GST to be shown separately)',
          'Please mention HSN/SAC code for each item',
          'Technical specifications and catalog to be provided where applicable',
          `Quotation must be submitted before ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        ]

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#495057')

        terms.forEach((term, index) => {
          doc.text(`${index + 1}. ${term}`, 60, doc.y + 3)
        })

        // Special Instructions
        if (rfq.specialInstructions) {
          doc.moveDown()
             .font('Helvetica-Bold')
             .fontSize(10)
             .fillColor('#2c3e50')
             .text('Special Instructions:', 40)
             .font('Helvetica')
             .fontSize(9)
             .fillColor('#495057')
             .text(rfq.specialInstructions, 60)
        }

        // Footer section
        const footerY = doc.page.height - 80
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#212529')
           .text('For Mahakaushal Sugar and Power Industries Ltd.', 40, footerY)
        
        doc.font('Helvetica-Bold')
           .text('Authorized Signatory', doc.page.width - 180, footerY + 30)

        // Add page numbers
        const range = doc.bufferedPageRange()
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i)
          doc.font('Helvetica')
             .fontSize(8)
             .fillColor('#6c757d')
             .text(
               `Page ${i + 1} of ${range.count} | Generated on ${new Date().toLocaleDateString('en-IN')}`,
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

  /**
   * Generate vendor-specific RFQ PDF
   */
  async generateVendorRFQPDF(rfqId: string, vendorId: string): Promise<Buffer> {
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
      }
    })

    if (!rfq) {
      throw new Error('RFQ not found')
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Use the same PDF generation logic but with vendor-specific header
    const basePDF = await this.generateRFQPDF(rfqId)
    
    // For now, return the base PDF
    // In production, you would modify it to include vendor-specific details
    return basePDF
  }
}

// Export singleton instance
export const rfqPDFGeneratorV2 = new RFQPDFGeneratorV2()