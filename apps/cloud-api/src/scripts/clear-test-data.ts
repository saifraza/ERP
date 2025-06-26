import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearTestData() {
  console.log('🧹 Starting to clear test data (keeping admin user)...')
  
  try {
    // Get admin user to preserve
    const adminUser = await prisma.user.findFirst({
      where: { username: 'saif' }
    })
    
    if (!adminUser) {
      console.log('⚠️  Admin user "saif" not found. Creating one...')
      // You might want to create the admin user here if needed
    }
    
    console.log('Clearing procurement data...')
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
    
    console.log('Clearing transaction data...')
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
    
    console.log('Clearing documents...')
    await prisma.document.deleteMany()
    
    console.log('Clearing master data (except company structure)...')
    await prisma.customerContact.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.vendorContact.deleteMany()
    await prisma.vendorEmail.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.materialPrice.deleteMany()
    await prisma.material.deleteMany()
    await prisma.maintenance.deleteMany()
    await prisma.machine.deleteMany()
    
    // Keep company structure if admin user exists
    if (adminUser) {
      console.log('✅ Keeping admin user and company structure')
      console.log(`   Admin: ${adminUser.username} (${adminUser.email})`)
      
      const companyUser = await prisma.companyUser.findFirst({
        where: { userId: adminUser.id },
        include: { company: true }
      })
      
      if (companyUser) {
        console.log(`   Company: ${companyUser.company.name}`)
      }
    }
    
    console.log('✅ Test data cleared successfully!')
    console.log('📝 Admin user and company structure preserved')
    console.log('🔄 You can now test with a clean slate')
    
    // Show what remains
    const remainingCounts = {
      users: await prisma.user.count(),
      companies: await prisma.company.count(),
      divisions: await prisma.division.count(),
      departments: await prisma.department.count(),
      vendors: await prisma.vendor.count(),
      materials: await prisma.material.count(),
      rfqs: await prisma.rFQ.count(),
      requisitions: await prisma.purchaseRequisition.count()
    }
    
    console.log('\n📊 Remaining data:')
    Object.entries(remainingCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Error clearing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run immediately
clearTestData()