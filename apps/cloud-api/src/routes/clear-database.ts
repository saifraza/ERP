import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Clear all database data (for testing)
app.post('/clear-all', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user?.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403)
    }
    
    console.log('Starting database clear...')
    
    // Delete in correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Email related
      await tx.emailResponse.deleteMany()
      await tx.emailLog.deleteMany()
      
      // Procurement related
      await tx.quotationItem.deleteMany()
      await tx.quotation.deleteMany()
      await tx.rFQVendor.deleteMany()
      await tx.rFQItem.deleteMany()
      await tx.rFQ.deleteMany()
      await tx.purchaseRequisitionItem.deleteMany()
      await tx.purchaseRequisition.deleteMany()
      
      // Store related
      await tx.goodsReceiptItem.deleteMany()
      await tx.goodsReceipt.deleteMany()
      await tx.purchaseOrderItem.deleteMany()
      await tx.purchaseOrder.deleteMany()
      await tx.requisitionItem.deleteMany()
      await tx.requisition.deleteMany()
      
      // Finance related
      await tx.invoiceItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.payment.deleteMany()
      await tx.bankAccount.deleteMany()
      
      // Inventory
      await tx.stockTransferItem.deleteMany()
      await tx.stockTransfer.deleteMany()
      await tx.inventory.deleteMany()
      
      // Master data
      await tx.materialCategory.deleteMany()
      await tx.material.deleteMany()
      await tx.vendorCategory.deleteMany()
      await tx.vendorInvoice.deleteMany()
      await tx.vendor.deleteMany()
      await tx.customer.deleteMany()
      await tx.hSNCode.deleteMany()
      await tx.taxRate.deleteMany()
      await tx.uOM.deleteMany()
      await tx.account.deleteMany()
      await tx.approvalMatrix.deleteMany()
      
      // Factory related
      await tx.weighbridgeEntry.deleteMany()
      await tx.equipment.deleteMany()
      await tx.factory.deleteMany()
      
      // Company related
      await tx.division.deleteMany()
      await tx.emailCredential.deleteMany()
      await tx.companyUser.deleteMany()
      await tx.company.deleteMany()
      
      // Keep users but clear their linked emails
      await tx.user.updateMany({
        data: { linkedGmailEmail: null }
      })
    })
    
    console.log('Database cleared successfully')
    
    return c.json({ 
      message: 'Database cleared successfully',
      note: 'Users kept but linkedGmailEmail cleared'
    })
  } catch (error) {
    console.error('Clear database error:', error)
    return c.json({ error: 'Failed to clear database' }, 500)
  }
})

// Get database stats
app.get('/stats', authMiddleware, async (c) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      companies: await prisma.company.count(),
      factories: await prisma.factory.count(),
      vendors: await prisma.vendor.count(),
      materials: await prisma.material.count(),
      requisitions: await prisma.purchaseRequisition.count(),
      rfqs: await prisma.rFQ.count(),
      quotations: await prisma.quotation.count()
    }
    
    return c.json({ stats })
  } catch (error) {
    console.error('Stats error:', error)
    return c.json({ error: 'Failed to get stats' }, 500)
  }
})

export default app