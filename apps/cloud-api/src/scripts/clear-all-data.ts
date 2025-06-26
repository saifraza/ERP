import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllData() {
  console.log('🧹 Starting to clear all data from tables...')
  
  try {
    // Disable foreign key checks for PostgreSQL
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;')
    
    // Clear tables in reverse order of dependencies
    console.log('Clearing procurement tables...')
    await prisma.vendorInvoiceItem.deleteMany()
    await prisma.vendorInvoice.deleteMany()
    await prisma.quotationItem.deleteMany()
    await prisma.quotation.deleteMany()
    await prisma.rFQItem.deleteMany()
    await prisma.rFQVendor.deleteMany()
    await prisma.rFQEmailResponse.deleteMany()
    await prisma.rFQEmailLog.deleteMany()
    await prisma.rFQCommunicationThread.deleteMany()
    await prisma.rFQ.deleteMany()
    await prisma.purchaseRequisitionItem.deleteMany()
    await prisma.purchaseRequisition.deleteMany()
    
    console.log('Clearing transaction tables...')
    await prisma.journalLine.deleteMany()
    await prisma.journal.deleteMany()
    await prisma.paymentLine.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.invoiceLine.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.goodsReceiptLine.deleteMany()
    await prisma.goodsReceipt.deleteMany()
    await prisma.purchaseOrderLine.deleteMany()
    await prisma.purchaseOrder.deleteMany()
    await prisma.requisitionLine.deleteMany()
    await prisma.requisition.deleteMany()
    
    console.log('Clearing master data...')
    await prisma.customerContact.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.vendorContact.deleteMany()
    await prisma.vendorEmail.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.materialPrice.deleteMany()
    await prisma.material.deleteMany()
    await prisma.maintenance.deleteMany()
    await prisma.machine.deleteMany()
    await prisma.account.deleteMany()
    await prisma.costCenter.deleteMany()
    await prisma.taxRate.deleteMany()
    await prisma.hSNCode.deleteMany()
    await prisma.uOM.deleteMany()
    await prisma.uOMConversion.deleteMany()
    await prisma.emailCredential.deleteMany()
    await prisma.approvalMatrix.deleteMany()
    await prisma.factory.deleteMany()
    await prisma.division.deleteMany()
    await prisma.department.deleteMany()
    
    console.log('Clearing document tables...')
    await prisma.document.deleteMany()
    
    console.log('Clearing company users...')
    await prisma.companyUser.deleteMany()
    
    console.log('Clearing companies...')
    await prisma.company.deleteMany()
    
    console.log('Clearing users...')
    await prisma.user.deleteMany()
    
    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
    
    console.log('✅ All data cleared successfully!')
    console.log('📝 Tables structure remains intact')
    console.log('🔄 You can now set up a fresh company with email linking')
    
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    // Try to re-enable foreign key checks even if error occurred
    try {
      await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
    } catch (e) {
      console.error('Failed to re-enable foreign key checks')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Add confirmation prompt
console.log('⚠️  WARNING: This will delete ALL data from ALL tables!')
console.log('⚠️  The table structure will remain intact')
console.log('⚠️  This action cannot be undone!')
console.log('')
console.log('To proceed, run: npm run clear-data --confirm')

// Check for --confirm flag
if (process.argv.includes('--confirm')) {
  clearAllData()
} else {
  console.log('❌ Aborted. Add --confirm flag to proceed.')
  process.exit(0)
}