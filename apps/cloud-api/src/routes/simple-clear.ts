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
    
    // Level 1: Most dependent tables (no other tables depend on these)
    await prisma.emailResponse.deleteMany({})
    await prisma.emailLog.deleteMany({})
    await prisma.quotationItem.deleteMany({})
    await prisma.rFQVendor.deleteMany({})
    await prisma.rFQItem.deleteMany({})
    await prisma.purchaseOrderItem.deleteMany({})
    await prisma.goodsReceiptItem.deleteMany({})
    await prisma.invoiceItem.deleteMany({})
    await prisma.stockTransferItem.deleteMany({})
    await prisma.requisitionItem.deleteMany({})
    
    // Level 2: Tables that depend on Level 1
    await prisma.quotation.deleteMany({})
    await prisma.rFQ.deleteMany({})
    await prisma.purchaseOrder.deleteMany({})
    await prisma.goodsReceipt.deleteMany({})
    await prisma.invoice.deleteMany({})
    await prisma.payment.deleteMany({})
    await prisma.stockTransfer.deleteMany({})
    await prisma.requisition.deleteMany({})
    await prisma.purchaseRequisitionItem.deleteMany({})
    await prisma.purchaseRequisition.deleteMany({})
    
    // Level 3: Master data and inventory
    await prisma.inventory.deleteMany({})
    await prisma.materialCategory.deleteMany({})
    await prisma.material.deleteMany({})
    await prisma.vendorCategory.deleteMany({})
    await prisma.vendorInvoice.deleteMany({})
    await prisma.vendor.deleteMany({})
    await prisma.customer.deleteMany({})
    await prisma.bankAccount.deleteMany({})
    await prisma.approvalMatrix.deleteMany({})
    
    // Level 4: Factory and division related
    await prisma.weighbridgeEntry.deleteMany({})
    await prisma.equipment.deleteMany({})
    await prisma.department.deleteMany({})
    await prisma.factory.deleteMany({})
    await prisma.division.deleteMany({})
    
    // Level 5: Company related
    await prisma.companyUser.deleteMany({})
    await prisma.emailCredential.deleteMany({})
    
    // Level 6: Core tables
    await prisma.hSNCode.deleteMany({})
    await prisma.taxRate.deleteMany({})
    await prisma.uOM.deleteMany({})
    await prisma.account.deleteMany({})
    
    // Finally delete companies
    const deleted = await prisma.company.deleteMany({})
    
    console.log(`Cleared all data! Deleted ${deleted.count} companies`)
    
    return c.json({ 
      message: 'Companies deleted successfully',
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Clear company error:', error)
    return c.json({ 
      error: 'Failed to clear companies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app