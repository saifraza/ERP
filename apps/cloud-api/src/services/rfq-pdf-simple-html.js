import { prisma } from '../lib/prisma.js'

export class RFQPDFGenerator {
  async generateRFQPDF(rfqId) {
    try {
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

      // Simple HTML generation without any complex logic
      const html = this.generateSimpleHTML(rfq)
      return Buffer.from(html, 'utf-8')
    } catch (error) {
      console.error('Error in generateRFQPDF:', error)
      throw error
    }
  }

  async generateVendorRFQPDF(rfqId, vendorId) {
    try {
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

      const html = this.generateSimpleHTML(rfq, vendor)
      return Buffer.from(html, 'utf-8')
    } catch (error) {
      console.error('Error in generateVendorRFQPDF:', error)
      throw error
    }
  }

  async generateAndSaveRFQ(rfqId) {
    try {
      const buffer = await this.generateRFQPDF(rfqId)
      
      const rfq = await prisma.rFQ.findUnique({
        where: { id: rfqId },
        select: { rfqNumber: true }
      })

      const filename = `RFQ_${rfq?.rfqNumber || 'document'}_${new Date().getTime()}`
      return { buffer, filename }
    } catch (error) {
      console.error('Error in generateAndSaveRFQ:', error)
      throw error
    }
  }

  generateSimpleHTML(rfq, vendor = null) {
    const formatDate = (date) => {
      try {
        return new Date(date).toLocaleDateString('en-IN')
      } catch {
        return 'N/A'
      }
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>RFQ ${rfq.rfqNumber || ''}</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.header { background: #b4d04a; padding: 20px; text-align: center; margin: -20px -20px 20px; }
.company-name { font-size: 20pt; font-weight: bold; color: #5e4b3d; }
.details { font-size: 9pt; margin-top: 10px; }
h1 { text-align: center; margin: 30px 0; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background: #f0f0f0; }
.terms { margin-top: 30px; }
.footer { margin-top: 50px; }
</style>
</head>
<body>
<div class="header">
<div class="company-name">Mahakaushal Sugar and Power Industries Ltd.</div>
<div class="details">
CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1<br>
Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,<br>
Bawadiya Kalan, Bhopal-462039<br>
Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001<br>
E-mail : mspil.acc@gmail.com | mspil.power@gmail.com
</div>
</div>

<h1>REQUEST FOR QUOTATION</h1>

<p><strong>RFQ No.:</strong> ${rfq.rfqNumber || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Date:</strong> ${formatDate(rfq.issueDate)}</p>
<p><strong>Due Date:</strong> ${formatDate(rfq.submissionDeadline)}</p>

<div style="margin: 20px 0;">
<strong>To:</strong><br>
${vendor ? `${vendor.name}<br>${vendor.addressLine1 || ''}<br>${vendor.city || ''}, ${vendor.state || ''} - ${vendor.pincode || ''}` : '[Vendor Details]'}
</div>

<p>Dear Sir/Madam,</p>
<p>We invite you to submit your quotation for the following items:</p>

<table>
<tr>
<th>S.No.</th>
<th>Item Code</th>
<th>Description</th>
<th>Quantity</th>
<th>Unit</th>
<th>Req. Date</th>
</tr>
${rfq.items.map((item, i) => `
<tr>
<td>${i + 1}</td>
<td>${item.itemCode || item.material?.code || ''}</td>
<td>${item.itemDescription || item.material?.name || ''}</td>
<td>${item.quantity || 0}</td>
<td>${item.unit || item.material?.uom?.code || 'NOS'}</td>
<td>${formatDate(item.requiredDate)}</td>
</tr>
`).join('')}
</table>

<div class="terms">
<strong>Terms & Conditions:</strong><br>
1. Delivery Terms: ${rfq.deliveryTerms || 'As per agreement'}<br>
2. Payment Terms: ${rfq.paymentTerms || 'As per agreement'}<br>
3. Expected Delivery Date: ${formatDate(rfq.expectedDeliveryDate)}<br>
4. Quotation Validity: ${rfq.quotationValidityDays || 30} days<br>
5. Prices should be inclusive of all taxes and duties<br>
6. Please mention HSN/SAC code against each item<br>
7. Quotation should reach us on or before the due date
</div>

<div class="footer">
<p>Thanking you,<br>
Yours faithfully,<br>
For Mahakaushal Sugar and Power Industries Ltd.</p>
<br><br>
<p>_______________________<br>
Authorized Signatory</p>
</div>
</body>
</html>`
  }
}

export const rfqPDFGenerator = new RFQPDFGenerator()