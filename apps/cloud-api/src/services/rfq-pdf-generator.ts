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

export class RFQPDFGenerator {
  /**
   * Generate RFQ PDF with proper formatting and letterhead
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
        // Get PDFDocument class
        const PDFDoc = await getPDFDocument()
        
        // Create PDF document
        const doc = new PDFDoc({
          size: 'A4',
          margin: 50,
          bufferPages: true
        })

        // Collect PDF data
        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Header with letterhead placeholder
        // In production, you would load the actual letterhead image
        doc.rect(0, 0, doc.page.width, 120)
           .fill('#b4d04a')
        
        // Company name
        doc.font('Helvetica-Bold')
           .fontSize(22)
           .fillColor('#5e4b3d')
           .text('Mahakaushal Sugar and Power Industries Ltd.', 50, 30, {
             align: 'center',
             width: doc.page.width - 100
           })

        // Company details
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#333')
           .text('CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1', 50, 60, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,', 50, 75, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Bawadiya Kalan, Bhopal-462039', 50, 90, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001', 50, 105, {
             align: 'center',
             width: doc.page.width - 100
           })

        // Title
        doc.moveDown(3)
           .font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('#000')
           .text('REQUEST FOR QUOTATION', {
             align: 'center',
             underline: true
           })

        // RFQ Details
        doc.moveDown()
           .font('Helvetica')
           .fontSize(11)
           .text(`RFQ No.: ${rfq.rfqNumber}`, 50)
           .text(`Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}`, doc.page.width - 200, doc.y - doc.currentLineHeight(), {
             align: 'right',
             width: 150
           })

        doc.moveDown()
           .text(`Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)

        // To section for vendor RFQs (we'll show general info for now)
        doc.moveDown()
           .font('Helvetica-Bold')
           .text('To:')
           .font('Helvetica')
           .text('[Vendor Name]')
           .text('[Vendor Address]')
           .moveDown()

        // Subject
        doc.font('Helvetica')
           .text('Dear Sir/Madam,')
           .moveDown()
           .text(`We invite you to submit your quotation for the following items as per the details given below:`)

        // Items table
        doc.moveDown()
        const tableTop = doc.y
        const itemsPerPage = 15
        
        // Table headers
        doc.font('Helvetica-Bold')
           .fontSize(10)
        
        const col1 = 50
        const col2 = 100
        const col3 = 280
        const col4 = 350
        const col5 = 420
        const col6 = 480

        doc.text('S.No.', col1, tableTop)
           .text('Item Code', col2, tableTop)
           .text('Description', col3, tableTop)
           .text('Quantity', col4, tableTop)
           .text('Unit', col5, tableTop)
           .text('Req. Date', col6, tableTop)

        // Draw header line
        doc.moveTo(col1, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke()

        // Table rows
        let yPosition = tableTop + 25
        doc.font('Helvetica')
           .fontSize(9)

        rfq.items.forEach((item, index) => {
          if (index > 0 && index % itemsPerPage === 0) {
            doc.addPage()
            yPosition = 50
          }

          doc.text(String(index + 1), col1, yPosition)
             .text(item.itemCode || item.material?.code || '', col2, yPosition)
             .text(item.itemDescription || item.material?.name || '', col3, yPosition, {
               width: col4 - col3 - 10,
               ellipsis: true
             })
             .text(String(item.quantity), col4, yPosition)
             .text(item.unit || item.material?.uom?.code || 'NOS', col5, yPosition)
             .text(new Date(item.requiredDate).toLocaleDateString('en-IN'), col6, yPosition)

          if (item.specifications) {
            yPosition += 15
            doc.fontSize(8)
               .text(`Specs: ${item.specifications}`, col2, yPosition, {
                 width: 400,
                 continued: false
               })
               .fontSize(9)
            yPosition += 5
          }

          yPosition += 20
        })

        // Draw bottom line
        doc.moveTo(col1, yPosition - 5)
           .lineTo(550, yPosition - 5)
           .stroke()

        // Terms and conditions
        doc.moveDown(2)
           .font('Helvetica-Bold')
           .fontSize(11)
           .text('Terms & Conditions:', 50)
           .font('Helvetica')
           .fontSize(10)
           .moveDown(0.5)

        const terms = [
          `1. Delivery Terms: ${rfq.deliveryTerms}`,
          `2. Payment Terms: ${rfq.paymentTerms}`,
          `3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}`,
          `4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation`,
          `5. Prices should be inclusive of all taxes and duties`,
          `6. Please mention HSN/SAC code against each item`,
          `7. Quotation should reach us on or before the due date mentioned above`
        ]

        terms.forEach(term => {
          doc.text(term, 70)
             .moveDown(0.3)
        })

        if (rfq.specialInstructions) {
          doc.moveDown()
             .font('Helvetica-Bold')
             .text('Special Instructions:', 50)
             .font('Helvetica')
             .text(rfq.specialInstructions, 70)
        }

        // Footer
        doc.moveDown(2)
           .fontSize(10)
           .text('For Mahakaushal Sugar and Power Industries Ltd.', 50)
           .moveDown(3)
           .text('Authorized Signatory', doc.page.width - 200, doc.y, {
             align: 'right',
             width: 150
           })

        // Add page numbers
        const range = doc.bufferedPageRange()
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i)
          doc.fontSize(8)
             .text(`Page ${i + 1} of ${range.count}`, 
               50, 
               doc.page.height - 30, 
               { align: 'center', width: doc.page.width - 100 }
             )
        }

        // Finalize PDF
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
    // Fetch RFQ data
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

    // Fetch specific vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Get PDFDocument class
        const PDFDoc = await getPDFDocument()
        
        // Create PDF document
        const doc = new PDFDoc({
          size: 'A4',
          margin: 50,
          bufferPages: true
        })

        // Collect PDF data
        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Header with letterhead
        doc.rect(0, 0, doc.page.width, 120)
           .fill('#b4d04a')
        
        // Company name
        doc.font('Helvetica-Bold')
           .fontSize(22)
           .fillColor('#5e4b3d')
           .text('Mahakaushal Sugar and Power Industries Ltd.', 50, 30, {
             align: 'center',
             width: doc.page.width - 100
           })

        // Company details
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#333')
           .text('CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1', 50, 60, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,', 50, 75, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Bawadiya Kalan, Bhopal-462039', 50, 90, {
             align: 'center',
             width: doc.page.width - 100
           })
           .text('Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001', 50, 105, {
             align: 'center',
             width: doc.page.width - 100
           })

        // Email
        doc.fontSize(9)
           .text('E-mail : mspil.acc@gmail.com | mspil.power@gmail.com', 50, 120, {
             align: 'center',
             width: doc.page.width - 100
           })

        // Title
        doc.moveDown(3)
           .font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('#000')
           .text('REQUEST FOR QUOTATION', {
             align: 'center',
             underline: true
           })

        // RFQ Details
        doc.moveDown()
           .font('Helvetica')
           .fontSize(11)
           .text(`RFQ No.: ${rfq.rfqNumber}`, 50)
           .text(`Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}`, doc.page.width - 200, doc.y - doc.currentLineHeight(), {
             align: 'right',
             width: 150
           })

        doc.moveDown()
           .text(`Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)

        // Vendor details
        doc.moveDown()
           .font('Helvetica-Bold')
           .text('To:')
           .font('Helvetica')
           .text(vendor.name)
           .text(vendor.addressLine1 || '')
        
        if (vendor.addressLine2) {
          doc.text(vendor.addressLine2)
        }
        
        doc.text(`${vendor.city}, ${vendor.state} - ${vendor.pincode}`)
        
        if (vendor.email) {
          doc.text(`Email: ${vendor.email}`)
        }
        
        if (vendor.phone) {
          doc.text(`Phone: ${vendor.phone}`)
        }

        doc.moveDown()

        // Subject
        doc.font('Helvetica')
           .text('Dear Sir/Madam,')
           .moveDown()
           .text(`We invite you to submit your quotation for the following items as per the details given below:`)

        // Items table
        doc.moveDown()
        const tableTop = doc.y
        const itemsPerPage = 15
        
        // Table headers
        doc.font('Helvetica-Bold')
           .fontSize(10)
        
        const col1 = 50
        const col2 = 100
        const col3 = 280
        const col4 = 350
        const col5 = 420
        const col6 = 480

        doc.text('S.No.', col1, tableTop)
           .text('Item Code', col2, tableTop)
           .text('Description', col3, tableTop)
           .text('Quantity', col4, tableTop)
           .text('Unit', col5, tableTop)
           .text('Req. Date', col6, tableTop)

        // Draw header line
        doc.moveTo(col1, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke()

        // Table rows
        let yPosition = tableTop + 25
        doc.font('Helvetica')
           .fontSize(9)

        rfq.items.forEach((item, index) => {
          if (index > 0 && index % itemsPerPage === 0) {
            doc.addPage()
            yPosition = 50
          }

          doc.text(String(index + 1), col1, yPosition)
             .text(item.itemCode || item.material?.code || '', col2, yPosition)
             .text(item.itemDescription || item.material?.name || '', col3, yPosition, {
               width: col4 - col3 - 10,
               ellipsis: true
             })
             .text(String(item.quantity), col4, yPosition)
             .text(item.unit || item.material?.uom?.code || 'NOS', col5, yPosition)
             .text(new Date(item.requiredDate).toLocaleDateString('en-IN'), col6, yPosition)

          if (item.specifications) {
            yPosition += 15
            doc.fontSize(8)
               .text(`Specs: ${item.specifications}`, col2, yPosition, {
                 width: 400,
                 continued: false
               })
               .fontSize(9)
            yPosition += 5
          }

          yPosition += 20
        })

        // Draw bottom line
        doc.moveTo(col1, yPosition - 5)
           .lineTo(550, yPosition - 5)
           .stroke()

        // Terms and conditions
        doc.moveDown(2)
           .font('Helvetica-Bold')
           .fontSize(11)
           .text('Terms & Conditions:', 50)
           .font('Helvetica')
           .fontSize(10)
           .moveDown(0.5)

        const terms = [
          `1. Delivery Terms: ${rfq.deliveryTerms}`,
          `2. Payment Terms: ${rfq.paymentTerms}`,
          `3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}`,
          `4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation`,
          `5. Prices should be inclusive of all taxes and duties`,
          `6. Please mention HSN/SAC code against each item`,
          `7. Quotation should reach us on or before the due date mentioned above`,
          `8. Please send your quotation to: mspil.acc@gmail.com`
        ]

        terms.forEach(term => {
          doc.text(term, 70)
             .moveDown(0.3)
        })

        if (rfq.specialInstructions) {
          doc.moveDown()
             .font('Helvetica-Bold')
             .text('Special Instructions:', 50)
             .font('Helvetica')
             .text(rfq.specialInstructions, 70)
        }

        // Footer
        doc.moveDown(2)
           .fontSize(10)
           .text('Thanking you,', 50)
           .moveDown()
           .text('Yours faithfully,')
           .moveDown()
           .text('For Mahakaushal Sugar and Power Industries Ltd.')
           .moveDown(3)
           .text('Authorized Signatory', doc.page.width - 200, doc.y, {
             align: 'right',
             width: 150
           })

        // Add page numbers
        const range = doc.bufferedPageRange()
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i)
          doc.fontSize(8)
             .text(`Page ${i + 1} of ${range.count}`, 
               50, 
               doc.page.height - 30, 
               { align: 'center', width: doc.page.width - 100 }
             )
        }

        // Finalize PDF
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
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