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
      // Helper function to safely delete
      const safeDelete = async (model: any, name: string) => {
        try {
          if (model) {
            const count = await model.deleteMany({})
            console.log(`Deleted ${count.count} records from ${name}`)
          }
        } catch (e) {
          console.log(`Skipping ${name}: ${e.message}`)
        }
      }

      // Level 1: Most dependent tables
      await safeDelete(prisma.rFQEmailResponse, 'RFQEmailResponse')
      await safeDelete(prisma.rFQEmailLog, 'RFQEmailLog')
      await safeDelete(prisma.rFQCommunicationThread, 'RFQCommunicationThread')
      await safeDelete(prisma.quotationItem, 'QuotationItem')
      await safeDelete(prisma.rFQVendor, 'RFQVendor')
      await safeDelete(prisma.rFQItem, 'RFQItem')
      await safeDelete(prisma.purchaseOrderItem, 'PurchaseOrderItem')
      await safeDelete(prisma.goodsReceiptItem, 'GoodsReceiptItem')
      await safeDelete(prisma.stockTransferItem, 'StockTransferItem')
      await safeDelete(prisma.requisitionItem, 'RequisitionItem')
      await safeDelete(prisma.journalEntry, 'JournalEntry')
      await safeDelete(prisma.documentActivity, 'DocumentActivity')
      
      // Level 2: Tables that depend on Level 1
      await safeDelete(prisma.quotationComparison, 'QuotationComparison')
      await safeDelete(prisma.quotation, 'Quotation')
      await safeDelete(prisma.rFQ, 'RFQ')
      await safeDelete(prisma.purchaseOrder, 'PurchaseOrder')
      await safeDelete(prisma.goodsReceipt, 'GoodsReceipt')
      await safeDelete(prisma.stockTransfer, 'StockTransfer')
      await safeDelete(prisma.requisition, 'Requisition')
      await safeDelete(prisma.purchaseRequisition, 'PurchaseRequisition')
      await safeDelete(prisma.journal, 'Journal')
      await safeDelete(prisma.document, 'Document')
      
      // Level 3: Operations and transactions
      await safeDelete(prisma.invoice, 'Invoice')
      await safeDelete(prisma.payment, 'Payment')
      await safeDelete(prisma.receipt, 'Receipt')
      await safeDelete(prisma.vendorInvoice, 'VendorInvoice')
      await safeDelete(prisma.farmerPayment, 'FarmerPayment')
      await safeDelete(prisma.caneDelivery, 'CaneDelivery')
      await safeDelete(prisma.maintenance, 'Maintenance')
      await safeDelete(prisma.alertLog, 'AlertLog')
      
      // Level 4: Production data
      await safeDelete(prisma.sugarProduction, 'SugarProduction')
      await safeDelete(prisma.ethanolProduction, 'EthanolProduction')
      await safeDelete(prisma.powerGeneration, 'PowerGeneration')
      await safeDelete(prisma.feedProduction, 'FeedProduction')
      await safeDelete(prisma.plantMetrics, 'PlantMetrics')
      
      // Level 5: Master data
      await safeDelete(prisma.inventory, 'Inventory')
      await safeDelete(prisma.material, 'Material')
      await safeDelete(prisma.vendor, 'Vendor')
      await safeDelete(prisma.customer, 'Customer')
      await safeDelete(prisma.farmer, 'Farmer')
      await safeDelete(prisma.banking, 'Banking')
      await safeDelete(prisma.approvalMatrix, 'ApprovalMatrix')
      await safeDelete(prisma.dashboardConfig, 'DashboardConfig')
      
      // Level 6: Factory and division related
      await safeDelete(prisma.weighbridgeEntry, 'WeighbridgeEntry')
      await safeDelete(prisma.equipment, 'Equipment')
      await safeDelete(prisma.department, 'Department')
      await safeDelete(prisma.factory, 'Factory')
      await safeDelete(prisma.division, 'Division')
      
      // Level 7: Company related
      await safeDelete(prisma.companyUser, 'CompanyUser')
      await safeDelete(prisma.emailCredential, 'EmailCredential')
      
      // Level 8: Core tables
      await safeDelete(prisma.hSNCode, 'HSNCode')
      await safeDelete(prisma.taxRate, 'TaxRate')
      await safeDelete(prisma.uOM, 'UOM')
      await safeDelete(prisma.account, 'Account')
      
      // Finally delete companies
      const deleted = await prisma.company.deleteMany({})
      console.log(`Deleted ${deleted.count} companies`)
      console.log('Database cleared successfully!')
      
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