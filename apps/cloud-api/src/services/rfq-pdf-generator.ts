import ReactPDF, { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { prisma } from '../lib/prisma.js'
import { getCustomizedTerms, categorySpecificTerms } from '../templates/rfq-terms.js'

// Register fonts for better typography
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
})

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000080',
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#000080',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.4,
  },
  rfqTitle: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#000080',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: '#000080',
    textDecoration: 'underline',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    width: 150,
    color: '#333333',
  },
  value: {
    fontSize: 11,
    flex: 1,
    color: '#000000',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: '#000080',
  },
  tableCell: {
    fontSize: 10,
  },
  terms: {
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: 'justify',
    marginBottom: 10,
  },
  termsHeading: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
    color: '#000080',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderTop: '1 solid #000000',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 10,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
  },
})

interface RFQPDFData {
  rfq: any
  company: any
  vendors: any[]
  items: any[]
  pr?: any
}

// RFQ Document Component
const RFQDocument = ({ data }: { data: RFQPDFData }) => {
  const { rfq, company, vendors, items, pr } = data
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Company Details */}
        <View style={styles.header}>
          {company.logo && (
            <Image style={styles.logo} src={company.logo} />
          )}
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyDetails}>
            {company.addressLine1}, {company.addressLine2 && `${company.addressLine2}, `}
            {company.city}, {company.state} - {company.pincode}
            {'\n'}Email: {company.email} | Phone: {company.phone}
            {'\n'}GST: {company.gstNumber} | PAN: {company.panNumber}
            {company.cinNumber && `\nCIN: ${company.cinNumber}`}
          </Text>
        </View>

        {/* RFQ Title */}
        <Text style={styles.rfqTitle}>REQUEST FOR QUOTATION (RFQ)</Text>

        {/* RFQ Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RFQ DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>RFQ Number:</Text>
            <Text style={styles.value}>{rfq.rfqNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{new Date(rfq.issueDate).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')}</Text>
          </View>
          {pr && (
            <View style={styles.row}>
              <Text style={styles.label}>PR Reference:</Text>
              <Text style={styles.value}>{pr.requisitionNo}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Division:</Text>
            <Text style={styles.value}>{pr?.division?.name || 'General'}</Text>
          </View>
        </View>

        {/* Vendor Details (if single vendor) */}
        {vendors.length === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TO</Text>
            <Text style={styles.value}>{vendors[0].name}</Text>
            <Text style={styles.value}>{vendors[0].addressLine1}</Text>
            {vendors[0].addressLine2 && <Text style={styles.value}>{vendors[0].addressLine2}</Text>}
            <Text style={styles.value}>{vendors[0].city}, {vendors[0].state} - {vendors[0].pincode}</Text>
            <Text style={styles.value}>GST: {vendors[0].gstNumber || 'N/A'}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REQUIRED ITEMS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: '10%' }]}>
                <Text style={styles.tableCellHeader}>S.No</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '40%' }]}>
                <Text style={styles.tableCellHeader}>Item Description</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '15%' }]}>
                <Text style={styles.tableCellHeader}>Specification</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '10%' }]}>
                <Text style={styles.tableCellHeader}>UOM</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '15%' }]}>
                <Text style={styles.tableCellHeader}>Quantity</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '10%' }]}>
                <Text style={styles.tableCellHeader}>Delivery</Text>
              </View>
            </View>
            {items.map((item, index) => (
              <View style={styles.tableRow} key={item.id}>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text style={styles.tableCell}>{index + 1}</Text>
                </View>
                <View style={[styles.tableCol, { width: '40%' }]}>
                  <Text style={styles.tableCell}>{item.material?.name || item.itemDescription || '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text style={styles.tableCell}>{item.specifications || item.specification || '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text style={styles.tableCell}>{item.material?.uom?.code || item.unit || '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%' }]}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
                <View style={[styles.tableCol, { width: '10%' }]}>
                  <Text style={styles.tableCell}>{item.requiredDate ? new Date(item.requiredDate).toLocaleDateString('en-IN') : 'ASAP'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} style={styles.pageNumber} fixed />
      </Page>

      {/* Terms and Conditions Pages */}
      {(() => {
        const terms = getCustomizedTerms(
          parseInt(rfq.paymentTerms) || 30,
          rfq.deliveryTerms || 'Ex-Works',
          rfq.warrantyTerms || '12 months',
          `${company.city} District Court`
        )
        
        const sections = [
          terms.commercial,
          terms.technical,
          terms.submission,
          terms.evaluation,
          terms.general,
          // Add sugar industry specific terms if division is sugar/ethanol
          ...(pr?.division?.name?.toLowerCase().includes('sugar') || 
             pr?.division?.name?.toLowerCase().includes('ethanol') 
             ? [terms.sugarIndustrySpecific] : [])
        ]
        
        return sections.map((section, pageIndex) => (
          <Page key={pageIndex} size="A4" style={styles.page}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={{ marginBottom: 15 }}>
                  <Text style={styles.termsHeading}>
                    {itemIndex + 1}. {item.heading}:
                  </Text>
                  <Text style={styles.terms}>
                    {item.points.map((point, pointIndex) => (
                      `• ${point}`
                    )).join('\n')}
                  </Text>
                </View>
              ))}
              
              {rfq.specialTerms && pageIndex === sections.length - 1 && (
                <>
                  <Text style={styles.termsHeading}>SPECIAL CONDITIONS:</Text>
                  <Text style={styles.terms}>{rfq.specialTerms}</Text>
                </>
              )}
            </View>

            {/* Signature Section on last page */}
            {pageIndex === sections.length - 1 && (
              <View style={styles.footer}>
                <View style={styles.signature}>
                  <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine}>
                      <Text style={styles.signatureText}>Authorized Signatory</Text>
                      <Text style={styles.signatureText}>{company.name}</Text>
                    </View>
                  </View>
                  <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine}>
                      <Text style={styles.signatureText}>Date & Stamp</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} of ${totalPages}`
            )} style={styles.pageNumber} fixed />
          </Page>
        ))
      })()}
    </Document>
  )
}

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

    // Prepare vendor list
    const vendors = rfq.vendors.map(v => v.vendor)

    // Prepare data for PDF
    const pdfData: RFQPDFData = {
      rfq,
      company: rfq.company,
      vendors,
      items: rfq.items,
      pr: rfq.requisition
    }

    // Generate PDF
    const pdfBuffer = await ReactPDF.renderToBuffer(<RFQDocument data={pdfData} />)

    return pdfBuffer
  }

  /**
   * Generate RFQ PDF with custom data
   */
  async generateCustomRFQPDF(data: RFQPDFData): Promise<Buffer> {
    const pdfDoc = <RFQDocument data={data} />
    const pdfBuffer = await ReactPDF.renderToBuffer(pdfDoc)
    return pdfBuffer
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

    // Prepare data for PDF
    const pdfData: RFQPDFData = {
      rfq,
      company: rfq.company,
      vendors: [vendor],
      items: rfq.items,
      pr: rfq.requisition
    }

    // Generate PDF
    const pdfBuffer = await ReactPDF.renderToBuffer(<RFQDocument data={pdfData} />)

    return pdfBuffer
  }
}

// Export singleton instance
export const rfqPDFGenerator = new RFQPDFGenerator()