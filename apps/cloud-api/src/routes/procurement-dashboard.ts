import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Get procurement dashboard statistics
app.get('/', async (c) => {
  const userId = c.get('userId')
  const { range = 'month' } = c.req.query()
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    const companyId = companyUser.companyId
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    // Get requisition statistics
    const requisitions = await prisma.requisition.groupBy({
      by: ['status'],
      where: {
        factory: { companyId },
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    const requisitionStats = {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    }
    
    requisitions.forEach(r => {
      requisitionStats.total += r._count
      switch (r.status) {
        case 'DRAFT':
          requisitionStats.draft = r._count
          break
        case 'SUBMITTED':
          requisitionStats.submitted = r._count
          break
        case 'APPROVED':
          requisitionStats.approved = r._count
          break
        case 'CANCELLED':
          requisitionStats.rejected = r._count
          break
      }
    })
    
    // Get RFQ statistics
    const rfqs = await prisma.rfq.groupBy({
      by: ['status'],
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    const rfqStats = {
      total: 0,
      open: 0,
      closed: 0,
      awarded: 0
    }
    
    rfqs.forEach(r => {
      rfqStats.total += r._count
      switch (r.status) {
        case 'OPEN':
          rfqStats.open = r._count
          break
        case 'CLOSED':
          rfqStats.closed = r._count
          break
        case 'AWARDED':
          rfqStats.awarded = r._count
          break
      }
    })
    
    // Get Purchase Order statistics
    const purchaseOrders = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    const poStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      partial: 0,
      completed: 0
    }
    
    purchaseOrders.forEach(po => {
      poStats.total += po._count
      switch (po.status) {
        case 'PENDING':
          poStats.pending = po._count
          break
        case 'CONFIRMED':
          poStats.confirmed = po._count
          break
        case 'PARTIAL':
          poStats.partial = po._count
          break
        case 'COMPLETED':
          poStats.completed = po._count
          break
      }
    })
    
    // Get GRN statistics
    const grns = await prisma.goodsReceiptNote.groupBy({
      by: ['status'],
      where: {
        purchaseOrder: { companyId },
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    const grnStats = {
      total: 0,
      pending: 0,
      completed: 0
    }
    
    grns.forEach(grn => {
      grnStats.total += grn._count
      if (grn.status === 'PENDING') {
        grnStats.pending = grn._count
      } else if (grn.status === 'COMPLETED') {
        grnStats.completed = grn._count
      }
    })
    
    // Get vendor statistics
    const vendorStats = await prisma.vendor.aggregate({
      where: {
        companyId,
        isActive: true
      },
      _count: true
    })
    
    const newVendors = await prisma.vendor.count({
      where: {
        companyId,
        createdAt: { gte: startDate }
      }
    })
    
    // Get invoice statistics
    const invoices = await prisma.vendorInvoice.groupBy({
      by: ['status'],
      where: {
        vendor: { companyId },
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    const invoiceStats = {
      total: 0,
      pending: 0,
      approved: 0,
      paid: 0
    }
    
    invoices.forEach(inv => {
      invoiceStats.total += inv._count
      switch (inv.status) {
        case 'PENDING':
          invoiceStats.pending = inv._count
          break
        case 'APPROVED':
          invoiceStats.approved = inv._count
          break
        case 'PAID':
          invoiceStats.paid = inv._count
          break
      }
    })
    
    // Get payment amounts
    const totalPOValue = await prisma.purchaseOrder.aggregate({
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      _sum: {
        totalAmount: true
      }
    })
    
    const pendingPayments = await prisma.vendorInvoice.aggregate({
      where: {
        vendor: { companyId },
        status: { in: ['PENDING', 'APPROVED'] },
        createdAt: { gte: startDate }
      },
      _sum: {
        totalAmount: true
      }
    })
    
    const completedPayments = await prisma.vendorPayment.aggregate({
      where: {
        vendor: { companyId },
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: {
        amount: true
      }
    })
    
    // Calculate savings (mock calculation - in real world, this would be based on negotiated discounts)
    const savingsAmount = (totalPOValue._sum.totalAmount || 0) * 0.075 // 7.5% average savings
    
    // Get recent documents
    const recentDocs = []
    
    // Get recent requisitions
    const recentRequisitions = await prisma.requisition.findMany({
      where: {
        factory: { companyId }
      },
      select: {
        id: true,
        requisitionNo: true,
        requisitionDate: true,
        status: true,
        factory: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
    
    recentRequisitions.forEach(req => {
      recentDocs.push({
        id: req.id,
        type: 'PR' as const,
        documentNo: req.requisitionNo,
        date: req.requisitionDate.toISOString(),
        status: req.status.charAt(0).toUpperCase() + req.status.slice(1).toLowerCase(),
        vendor: req.factory.name
      })
    })
    
    // Get recent POs
    const recentPOs = await prisma.purchaseOrder.findMany({
      where: { companyId },
      select: {
        id: true,
        poNumber: true,
        poDate: true,
        status: true,
        totalAmount: true,
        vendor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    })
    
    recentPOs.forEach(po => {
      recentDocs.push({
        id: po.id,
        type: 'PO' as const,
        documentNo: po.poNumber,
        date: po.poDate.toISOString(),
        status: po.status.charAt(0).toUpperCase() + po.status.slice(1).toLowerCase(),
        amount: po.totalAmount,
        vendor: po.vendor.name
      })
    })
    
    // Sort by date
    recentDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return c.json({
      stats: {
        requisitions: requisitionStats,
        rfqs: rfqStats,
        purchaseOrders: poStats,
        grn: grnStats,
        invoices: invoiceStats,
        vendors: {
          total: vendorStats._count,
          active: vendorStats._count,
          new: newVendors
        },
        amounts: {
          totalPOValue: totalPOValue._sum.totalAmount || 0,
          pendingPayments: pendingPayments._sum.totalAmount || 0,
          completedPayments: completedPayments._sum.amount || 0,
          savingsAmount: Math.round(savingsAmount)
        }
      },
      recentDocs
    })
  } catch (error: any) {
    console.error('Error fetching procurement dashboard:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app