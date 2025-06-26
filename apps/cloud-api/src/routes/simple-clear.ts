import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Simple clear company data
app.post('/company', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user?.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403)
    }
    
    // Delete ALL tables in dependency order
    console.log('Starting complete database clear...')
    
    try {
      // Level 1: Most dependent tables
      await prisma.rFQEmailResponse.deleteMany({})
      await prisma.rFQEmailLog.deleteMany({})
      await prisma.rFQCommunicationThread.deleteMany({})
      await prisma.quotationItem.deleteMany({})
      await prisma.rFQVendor.deleteMany({})
      await prisma.rFQItem.deleteMany({})
      await prisma.purchaseOrderItem.deleteMany({})
      await prisma.goodsReceiptItem.deleteMany({})
      await prisma.stockTransferItem.deleteMany({})
      await prisma.requisitionItem.deleteMany({})
      await prisma.pRItem.deleteMany({})
      await prisma.journalEntry.deleteMany({})
      await prisma.documentActivity.deleteMany({})
      
      // Level 2: Tables that depend on Level 1
      await prisma.quotationComparison.deleteMany({})
      await prisma.quotation.deleteMany({})
      await prisma.rFQ.deleteMany({})
      await prisma.purchaseOrder.deleteMany({})
      await prisma.goodsReceipt.deleteMany({})
      await prisma.stockTransfer.deleteMany({})
      await prisma.requisition.deleteMany({})
      await prisma.purchaseRequisition.deleteMany({})
      await prisma.journal.deleteMany({})
      await prisma.document.deleteMany({})
      
      // Level 3: Operations and transactions
      await prisma.invoice.deleteMany({})
      await prisma.payment.deleteMany({})
      await prisma.receipt.deleteMany({})
      await prisma.vendorInvoice.deleteMany({})
      await prisma.farmerPayment.deleteMany({})
      await prisma.caneDelivery.deleteMany({})
      await prisma.maintenance.deleteMany({})
      await prisma.alertLog.deleteMany({})
      
      // Level 4: Production data
      await prisma.sugarProduction.deleteMany({})
      await prisma.ethanolProduction.deleteMany({})
      await prisma.powerGeneration.deleteMany({})
      await prisma.feedProduction.deleteMany({})
      await prisma.plantMetrics.deleteMany({})
      
      // Level 5: Master data
      await prisma.inventory.deleteMany({})
      await prisma.material.deleteMany({})
      await prisma.vendor.deleteMany({})
      await prisma.customer.deleteMany({})
      await prisma.farmer.deleteMany({})
      await prisma.banking.deleteMany({})
      await prisma.approvalMatrix.deleteMany({})
      await prisma.dashboardConfig.deleteMany({})
      
      // Level 6: Factory and division related
      await prisma.weighbridgeEntry.deleteMany({})
      await prisma.equipment.deleteMany({})
      await prisma.department.deleteMany({})
      await prisma.factory.deleteMany({})
      await prisma.division.deleteMany({})
      
      // Level 7: Company related
      await prisma.companyUser.deleteMany({})
      await prisma.emailCredential.deleteMany({})
      
      // Level 8: Core tables
      await prisma.hSNCode.deleteMany({})
      await prisma.taxRate.deleteMany({})
      await prisma.uOM.deleteMany({})
      await prisma.account.deleteMany({})
      
      // Finally delete companies
      const deleted = await prisma.company.deleteMany({})
      
      console.log(`Cleared all data! Deleted ${deleted.count} companies`)
      
      return c.json({ 
        message: 'All data cleared successfully',
        deletedCompanies: deleted.count
      })
    } catch (error) {
      console.error('Clear error:', error)
      throw error
    }
  } catch (error) {
    console.error('Clear company error:', error)
    return c.json({ 
      error: 'Failed to clear companies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app