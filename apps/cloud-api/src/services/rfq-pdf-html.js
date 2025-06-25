import { prisma } from '../lib/prisma.js'

// Generate HTML that looks like a proper RFQ document
function generateHTMLContent(rfq, vendor = null) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFQ ${rfq.rfqNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
        }
        .header {
            background-color: #b4d04a;
            margin: -20mm -20mm 20px -20mm;
            padding: 20px;
            text-align: center;
        }
        .company-name {
            font-size: 20pt;
            font-weight: bold;
            color: #5e4b3d;
            margin-bottom: 10px;
        }
        .company-details {
            font-size: 9pt;
            color: #333;
            line-height: 1.3;
        }
        .title {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            text-decoration: underline;
        }
        .rfq-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .terms {
            margin-top: 30px;
        }
        .term-item {
            margin-left: 20px;
            margin-bottom: 5px;
        }
        .footer {
            margin-top: 50px;
        }
        .signature {
            margin-top: 50px;
            text-align: right;
        }
        @media print {
            .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Mahakaushal Sugar and Power Industries Ltd.</div>
        <div class="company-details">
            CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1<br>
            Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,<br>
            Bawadiya Kalan, Bhopal-462039<br>
            Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001<br>
            E-mail : mspil.acc@gmail.com | mspil.power@gmail.com
        </div>
    </div>

    <h1 class="title">REQUEST FOR QUOTATION</h1>

    <div class="rfq-info">
        <div>RFQ No.: ${rfq.rfqNumber}</div>
        <div>Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}</div>
    </div>

    <div>Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>

    <div class="section">
        <div class="section-title">To:</div>
        ${vendor ? `
            <div>${vendor.name}</div>
            <div>${vendor.addressLine1}</div>
            ${vendor.addressLine2 ? `<div>${vendor.addressLine2}</div>` : ''}
            <div>${vendor.city}, ${vendor.state} - ${vendor.pincode}</div>
            ${vendor.email ? `<div>Email: ${vendor.email}</div>` : ''}
            ${vendor.phone ? `<div>Phone: ${vendor.phone}</div>` : ''}
        ` : `
            <div>[Vendor Name]</div>
            <div>[Vendor Address]</div>
        `}
    </div>

    <div class="section">
        <div>Dear Sir/Madam,</div>
        <p style="margin-top: 10px;">We invite you to submit your quotation for the following items as per the details given below:</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%">S.No.</th>
                <th style="width: 15%">Item Code</th>
                <th style="width: 35%">Description</th>
                <th style="width: 12%">Quantity</th>
                <th style="width: 10%">Unit</th>
                <th style="width: 20%">Req. Date</th>
            </tr>
        </thead>
        <tbody>
            ${rfq.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.itemCode || item.material?.code || ''}</td>
                    <td>${item.itemDescription || item.material?.name || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit || item.material?.uom?.code || 'NOS'}</td>
                    <td>${new Date(item.requiredDate).toLocaleDateString('en-IN')}</td>
                </tr>
                ${item.specifications ? `
                <tr>
                    <td></td>
                    <td colspan="5" style="font-size: 9pt;">Specifications: ${item.specifications}</td>
                </tr>
                ` : ''}
            `).join('')}
        </tbody>
    </table>

    <div class="terms">
        <div class="section-title">Terms & Conditions:</div>
        <div class="term-item">1. Delivery Terms: ${rfq.deliveryTerms}</div>
        <div class="term-item">2. Payment Terms: ${rfq.paymentTerms}</div>
        <div class="term-item">3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}</div>
        <div class="term-item">4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation</div>
        <div class="term-item">5. Prices should be inclusive of all taxes and duties</div>
        <div class="term-item">6. Please mention HSN/SAC code against each item</div>
        <div class="term-item">7. Quotation should reach us on or before the due date mentioned above</div>
        ${vendor ? '<div class="term-item">8. Please send your quotation to: mspil.acc@gmail.com</div>' : ''}
    </div>

    ${rfq.specialInstructions ? `
    <div class="section" style="margin-top: 20px;">
        <div class="section-title">Special Instructions:</div>
        <div style="margin-left: 20px;">${rfq.specialInstructions}</div>
    </div>
    ` : ''}

    <div class="footer">
        <div>Thanking you,</div>
        <div style="margin-top: 10px;">Yours faithfully,</div>
        <div style="margin-top: 5px;">For Mahakaushal Sugar and Power Industries Ltd.</div>
    </div>

    <div class="signature">
        <div>_______________________</div>
        <div>Authorized Signatory</div>
    </div>
</body>
</html>`

  return html
}

export class RFQPDFGenerator {
  async generateRFQPDF(rfqId) {
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

    // Generate HTML content
    const html = generateHTMLContent(rfq)
    
    // Return HTML as buffer
    return Buffer.from(html, 'utf-8')
  }

  async generateVendorRFQPDF(rfqId, vendorId) {
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

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Generate HTML content with vendor
    const html = generateHTMLContent(rfq, vendor)
    
    // Return HTML as buffer
    return Buffer.from(html, 'utf-8')
  }

  async generateAndSaveRFQ(rfqId) {
    const buffer = await this.generateRFQPDF(rfqId)
    
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      select: { rfqNumber: true }
    })

    const filename = `RFQ_${rfq?.rfqNumber}_${new Date().getTime()}`

    return { buffer, filename }
  }
}

export const rfqPDFGenerator = new RFQPDFGenerator()