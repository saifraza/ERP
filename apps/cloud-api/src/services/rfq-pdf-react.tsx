import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { prisma } from '../lib/prisma.js'

// Define styles
const styles = StyleSheet.create({
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
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666',
  },
})

// RFQ Document Component
const RFQDocument = ({ rfq, vendor }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>Mahakaushal Sugar and Power Industries Ltd.</Text>
        <Text style={styles.companyDetails}>CIN - U01543MP2005PLC017514, GSTIN - 23AAECM3666P1Z1</Text>
        <Text style={styles.companyDetails}>Regd off : SF-11, Second Floor, Aakriti Business Center, Aakriti Eco city,</Text>
        <Text style={styles.companyDetails}>Bawadiya Kalan, Bhopal-462039</Text>
        <Text style={styles.companyDetails}>Admin off & Factory : Village Bachai, Dist. Narsinghpur (M.P.) - 487001</Text>
        <Text style={styles.companyDetails}>E-mail : mspil.acc@gmail.com | mspil.power@gmail.com</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>REQUEST FOR QUOTATION</Text>

      {/* RFQ Info */}
      <View style={styles.rfqInfo}>
        <Text>RFQ No.: {rfq.rfqNumber}</Text>
        <Text>Date: {new Date(rfq.issueDate).toLocaleDateString('en-IN')}</Text>
      </View>
      
      <Text style={{ marginBottom: 10 }}>
        Quotation Due Date: {new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')} {new Date(rfq.submissionDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {/* To Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>To:</Text>
        {vendor ? (
          <>
            <Text>{vendor.name}</Text>
            <Text>{vendor.addressLine1}</Text>
            {vendor.addressLine2 && <Text>{vendor.addressLine2}</Text>}
            <Text>{vendor.city}, {vendor.state} - {vendor.pincode}</Text>
            {vendor.email && <Text>Email: {vendor.email}</Text>}
            {vendor.phone && <Text>Phone: {vendor.phone}</Text>}
          </>
        ) : (
          <>
            <Text>[Vendor Name]</Text>
            <Text>[Vendor Address]</Text>
          </>
        )}
      </View>

      {/* Introduction */}
      <Text style={{ marginBottom: 10 }}>Dear Sir/Madam,</Text>
      <Text style={{ marginBottom: 10 }}>
        We invite you to submit your quotation for the following items as per the details given below:
      </Text>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>S.No.</Text>
          <Text style={styles.col2}>Item Code</Text>
          <Text style={styles.col3}>Description</Text>
          <Text style={styles.col4}>Quantity</Text>
          <Text style={styles.col5}>Unit</Text>
          <Text style={styles.col6}>Req. Date</Text>
        </View>

        {/* Table Rows */}
        {rfq.items.map((item: any, index: number) => (
          <View key={item.id}>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.itemCode || item.material?.code || ''}</Text>
              <Text style={styles.col3}>{item.itemDescription || item.material?.name || ''}</Text>
              <Text style={styles.col4}>{item.quantity}</Text>
              <Text style={styles.col5}>{item.unit || item.material?.uom?.code || 'NOS'}</Text>
              <Text style={styles.col6}>{new Date(item.requiredDate).toLocaleDateString('en-IN')}</Text>
            </View>
            {item.specifications && (
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.col1}></Text>
                <Text style={[styles.col2, { fontSize: 8 }]}>Specs:</Text>
                <Text style={[styles.col3, { fontSize: 8, flex: 1 }]}>{item.specifications}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Terms & Conditions */}
      <View style={styles.terms}>
        <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
        <Text style={styles.termItem}>1. Delivery Terms: {rfq.deliveryTerms}</Text>
        <Text style={styles.termItem}>2. Payment Terms: {rfq.paymentTerms}</Text>
        <Text style={styles.termItem}>3. Expected Delivery Date: {new Date(rfq.expectedDeliveryDate).toLocaleDateString('en-IN')}</Text>
        <Text style={styles.termItem}>4. Quotation Validity: {rfq.quotationValidityDays} days from the date of quotation</Text>
        <Text style={styles.termItem}>5. Prices should be inclusive of all taxes and duties</Text>
        <Text style={styles.termItem}>6. Please mention HSN/SAC code against each item</Text>
        <Text style={styles.termItem}>7. Quotation should reach us on or before the due date mentioned above</Text>
        {vendor && <Text style={styles.termItem}>8. Please send your quotation to: mspil.acc@gmail.com</Text>}
      </View>

      {/* Special Instructions */}
      {rfq.specialInstructions && (
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>Special Instructions:</Text>
          <Text style={{ marginLeft: 15, fontSize: 9 }}>{rfq.specialInstructions}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thanking you,</Text>
        <Text style={{ marginTop: 10 }}>Yours faithfully,</Text>
        <Text style={{ marginTop: 5 }}>For Mahakaushal Sugar and Power Industries Ltd.</Text>
      </View>

      {/* Signature */}
      <Text style={styles.signature}>Authorized Signatory</Text>

      {/* Page Number */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </Page>
  </Document>
)

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

    // Generate PDF using React PDF
    const pdfDoc = await pdf(<RFQDocument rfq={rfq} vendor={null} />).toBuffer()
    return pdfDoc
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

    // Generate PDF using React PDF
    const pdfDoc = await pdf(<RFQDocument rfq={rfq} vendor={vendor} />).toBuffer()
    return pdfDoc
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