import { renderToBuffer } from '@react-pdf/renderer'
import { createElement as h } from 'react'
import { prisma } from '../lib/prisma.js'

// Helper to create React elements without JSX
async function createPDFDocument(rfq, vendor) {
  const styles = {
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: 'Helvetica',
    },
    header: {
      backgroundColor: '#b4d04a',
      margin: -30,
      marginBottom: 20,
      padding: 20,
      paddingTop: 30,
      paddingBottom: 30,
    },
    companyName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#5e4b3d',
      textAlign: 'center',
      marginBottom: 10,
    },
    companyDetails: {
      fontSize: 9,
      textAlign: 'center',
      color: '#333',
      marginBottom: 2,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 20,
      textDecoration: 'underline',
    },
    rfqInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    table: {
      marginTop: 10,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      padding: 5,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      padding: 5,
      minHeight: 20,
    },
    col1: { width: '8%', fontSize: 9 },
    col2: { width: '15%', fontSize: 9 },
    col3: { width: '35%', fontSize: 9 },
    col4: { width: '12%', fontSize: 9 },
    col5: { width: '10%', fontSize: 9 },
    col6: { width: '20%', fontSize: 9 },
    terms: {
      marginTop: 20,
      fontSize: 9,
    },
    termItem: {
      marginBottom: 3,
      marginLeft: 15,
    },
    footer: {
      marginTop: 40,
      fontSize: 10,
    },
    signature: {
      marginTop: 40,
      textAlign: 'right',
      fontSize: 10,
    },
  }

  // Import components dynamically
  const { Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')

  const doc = h(Document, {},
    h(Page, { size: 'A4', style: styles.page },
      // Header
      h(View, { style: styles.header },
        h(Text, { style: styles.companyName }, 'Mahakaushal Sugar and Power Industries Ltd.'),
        h(Text, { style: styles.companyDetails }, 'CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1'),
        h(Text, { style: styles.companyDetails }, 'Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,'),
        h(Text, { style: styles.companyDetails }, 'Bawadiya Kalan, Bhopal-462039'),
        h(Text, { style: styles.companyDetails }, 'Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001'),
        h(Text, { style: styles.companyDetails }, 'E-mail : mspil.acc@gmail.com | mspil.power@gmail.com')
      ),

      // Title
      h(Text, { style: styles.title }, 'REQUEST FOR QUOTATION'),

      // RFQ Info
      h(View, { style: styles.rfqInfo },
        h(Text, {}, `RFQ No.: ${rfq.rfqNumber}`),
        h(Text, {}, `Date: ${new Date(rfq.issueDate).toLocaleDateString('en-IN')}`)
      ),
      
      h(Text, { style: { marginBottom: 10 } },
        `Quotation Due Date: ${new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} ${new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      ),

      // To Section
      h(View, { style: styles.section },
        h(Text, { style: styles.sectionTitle }, 'To:'),
        vendor ? [
          h(Text, { key: 'name' }, vendor.name),
          h(Text, { key: 'addr1' }, vendor.addressLine1),
          vendor.addressLine2 && h(Text, { key: 'addr2' }, vendor.addressLine2),
          h(Text, { key: 'city' }, `${vendor.city}, ${vendor.state} - ${vendor.pincode}`),
          vendor.email && h(Text, { key: 'email' }, `Email: ${vendor.email}`),
          vendor.phone && h(Text, { key: 'phone' }, `Phone: ${vendor.phone}`)
        ].filter(Boolean) : [
          h(Text, { key: 'vendor1' }, '[Vendor Name]'),
          h(Text, { key: 'vendor2' }, '[Vendor Address]')
        ]
      ),

      // Introduction
      h(Text, { style: { marginBottom: 10 } }, 'Dear Sir/Madam,'),
      h(Text, { style: { marginBottom: 10 } },
        'We invite you to submit your quotation for the following items as per the details given below:'
      ),

      // Items Table
      h(View, { style: styles.table },
        // Table Header
        h(View, { style: styles.tableHeader },
          h(Text, { style: styles.col1 }, 'S.No.'),
          h(Text, { style: styles.col2 }, 'Item Code'),
          h(Text, { style: styles.col3 }, 'Description'),
          h(Text, { style: styles.col4 }, 'Quantity'),
          h(Text, { style: styles.col5 }, 'Unit'),
          h(Text, { style: styles.col6 }, 'Req. Date')
        ),

        // Table Rows
        ...rfq.items.flatMap((item, index) => {
          const rows = [
            h(View, { key: item.id, style: styles.tableRow },
              h(Text, { style: styles.col1 }, String(index + 1)),
              h(Text, { style: styles.col2 }, item.itemCode || item.material?.code || ''),
              h(Text, { style: styles.col3 }, item.itemDescription || item.material?.name || ''),
              h(Text, { style: styles.col4 }, String(item.quantity)),
              h(Text, { style: styles.col5 }, item.unit || item.material?.uom?.code || 'NOS'),
              h(Text, { style: styles.col6 }, new Date(item.requiredDate).toLocaleDateString('en-IN'))
            )
          ]

          if (item.specifications) {
            rows.push(
              h(View, { key: `${item.id}-spec`, style: [styles.tableRow, { borderBottomWidth: 0 }] },
                h(Text, { style: styles.col1 }),
                h(Text, { style: [styles.col2, { fontSize: 8 }] }, 'Specs:'),
                h(Text, { style: [styles.col3, { fontSize: 8, flex: 1 }] }, item.specifications)
              )
            )
          }

          return rows
        })
      ),

      // Terms & Conditions
      h(View, { style: styles.terms },
        h(Text, { style: styles.sectionTitle }, 'Terms & Conditions:'),
        h(Text, { style: styles.termItem }, `1. Delivery Terms: ${rfq.deliveryTerms}`),
        h(Text, { style: styles.termItem }, `2. Payment Terms: ${rfq.paymentTerms}`),
        h(Text, { style: styles.termItem }, `3. Expected Delivery Date: ${new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}`),
        h(Text, { style: styles.termItem }, `4. Quotation Validity: ${rfq.quotationValidityDays} days from the date of quotation`),
        h(Text, { style: styles.termItem }, '5. Prices should be inclusive of all taxes and duties'),
        h(Text, { style: styles.termItem }, '6. Please mention HSN/SAC code against each item'),
        h(Text, { style: styles.termItem }, '7. Quotation should reach us on or before the due date mentioned above'),
        vendor && h(Text, { style: styles.termItem }, '8. Please send your quotation to: mspil.acc@gmail.com')
      ),

      // Special Instructions
      rfq.specialInstructions && h(View, { style: [styles.section, { marginTop: 15 }] },
        h(Text, { style: styles.sectionTitle }, 'Special Instructions:'),
        h(Text, { style: { marginLeft: 15, fontSize: 9 } }, rfq.specialInstructions)
      ),

      // Footer
      h(View, { style: styles.footer },
        h(Text, {}, 'Thanking you,'),
        h(Text, { style: { marginTop: 10 } }, 'Yours faithfully,'),
        h(Text, { style: { marginTop: 5 } }, 'For Mahakaushal Sugar and Power Industries Ltd.')
      ),

      // Signature
      h(Text, { style: styles.signature }, 'Authorized Signatory')
    )
  )

  return doc
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

    try {
      const doc = await createPDFDocument(rfq, null)
      const buffer = await renderToBuffer(doc)
      return buffer
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to simple text format if PDF generation fails
      return this.generateSimpleText(rfq)
    }
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

    try {
      const doc = await createPDFDocument(rfq, vendor)
      const buffer = await renderToBuffer(doc)
      return buffer
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to simple text format if PDF generation fails
      return this.generateSimpleText(rfq, vendor)
    }
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

  // Fallback text generation
  generateSimpleText(rfq, vendor = null) {
    const separator = '='.repeat(80)
    const thinSeparator = '-'.repeat(80)
    
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
${vendor ? `${vendor.name}
${vendor.addressLine1}
${vendor.addressLine2 ? vendor.addressLine2 + '\n' : ''}${vendor.city}, ${vendor.state} - ${vendor.pincode}
${vendor.email ? 'Email: ' + vendor.email : ''}
${vendor.phone ? 'Phone: ' + vendor.phone : ''}` : '[Vendor Name]\n[Vendor Address]'}

Dear Sir/Madam,

We invite you to submit your quotation for the following items as per the details given below:

${thinSeparator}
S.No. | Item Code      | Description                          | Qty    | Unit  | Req. Date
${thinSeparator}
`

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
${vendor ? '8. Please send your quotation to: mspil.acc@gmail.com' : ''}

${rfq.specialInstructions ? `SPECIAL INSTRUCTIONS:\n${rfq.specialInstructions}\n\n` : ''}
Thanking you,

Yours faithfully,
For Mahakaushal Sugar and Power Industries Ltd.



_______________________
Authorized Signatory

${separator}
`

    return Buffer.from(content, 'utf-8')
  }
}

export const rfqPDFGenerator = new RFQPDFGenerator()