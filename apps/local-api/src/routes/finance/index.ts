import { Hono } from 'hono'
import vendors from './vendors'
import indents from './indents'
import rfq from './rfq'
import purchaseOrders from './purchase-orders'

const app = new Hono()

// Mount sub-routes
app.route('/vendors', vendors)
app.route('/indents', indents)
app.route('/rfq', rfq)
app.route('/purchase-orders', purchaseOrders)

// Finance dashboard summary
app.get('/dashboard', async (c) => {
  return c.json({
    summary: {
      vendors: {
        total: 145,
        active: 132,
        pending: 8,
        blacklisted: 5
      },
      indents: {
        total: 156,
        pending: 23,
        approved: 98,
        converted: 85
      },
      rfqs: {
        active: 12,
        responsePending: 8,
        underEvaluation: 4
      },
      purchaseOrders: {
        thisMonth: 45,
        value: 5500000,
        pending: 12,
        delivered: 28
      },
      payments: {
        due: 2500000,
        overdue: 150000,
        processed: 4800000
      }
    },
    alerts: [
      {
        type: 'warning',
        message: '5 invoices pending approval > 3 days',
        count: 5,
        link: '/finance/invoices?status=pending'
      },
      {
        type: 'info',
        message: '3 RFQs closing today',
        count: 3,
        link: '/finance/rfq?closing=today'
      },
      {
        type: 'error',
        message: '2 payments overdue',
        count: 2,
        link: '/finance/payments?status=overdue'
      }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'po_created',
        description: 'PO-2025-045 created for Industrial Supplies Co',
        amount: 125000,
        user: 'John Doe',
        timestamp: '2025-01-22T10:30:00Z'
      },
      {
        id: '2',
        type: 'vendor_approved',
        description: 'New vendor Engineering Solutions Ltd approved',
        user: 'Jane Smith',
        timestamp: '2025-01-22T09:15:00Z'
      },
      {
        id: '3',
        type: 'payment_processed',
        description: 'Payment of ₹250,000 to Tech Services Inc',
        amount: 250000,
        user: 'Finance Team',
        timestamp: '2025-01-21T16:45:00Z'
      }
    ],
    upcomingDeliveries: [
      {
        poNumber: 'PO-2025-042',
        vendor: 'Industrial Supplies Co',
        deliveryDate: '2025-01-25',
        items: 5,
        value: 85000
      },
      {
        poNumber: 'PO-2025-043',
        vendor: 'Tech Parts Ltd',
        deliveryDate: '2025-01-26',
        items: 3,
        value: 45000
      }
    ],
    cashFlow: {
      week: {
        inflow: 0,
        outflow: 850000,
        net: -850000
      },
      month: {
        inflow: 0,
        outflow: 3500000,
        net: -3500000
      }
    },
    topVendors: [
      {
        name: 'Industrial Supplies Co',
        thisMonth: 450000,
        ytd: 2800000,
        rating: 4.5
      },
      {
        name: 'Engineering Solutions Ltd',
        thisMonth: 380000,
        ytd: 2200000,
        rating: 4.2
      },
      {
        name: 'Tech Services Inc',
        thisMonth: 320000,
        ytd: 1900000,
        rating: 4.7
      }
    ]
  })
})

// Workflow status
app.get('/workflow-status', async (c) => {
  return c.json({
    workflows: [
      {
        type: 'procurement',
        steps: [
          { name: 'Indent', count: 156, pending: 23 },
          { name: 'RFQ', count: 132, pending: 12 },
          { name: 'Evaluation', count: 120, pending: 8 },
          { name: 'PO', count: 112, pending: 5 },
          { name: 'Delivery', count: 98, pending: 14 },
          { name: 'Payment', count: 84, pending: 14 }
        ]
      }
    ]
  })
})

// Budget utilization
app.get('/budget-status', async (c) => {
  return c.json({
    budgets: [
      {
        division: 'sugar',
        allocated: 10000000,
        utilized: 6500000,
        committed: 1500000,
        available: 2000000,
        percentage: 65
      },
      {
        division: 'power',
        allocated: 8000000,
        utilized: 5200000,
        committed: 1200000,
        available: 1600000,
        percentage: 65
      },
      {
        division: 'ethanol',
        allocated: 12000000,
        utilized: 7800000,
        committed: 2000000,
        available: 2200000,
        percentage: 65
      },
      {
        division: 'feed',
        allocated: 5000000,
        utilized: 3000000,
        committed: 800000,
        available: 1200000,
        percentage: 60
      }
    ],
    total: {
      allocated: 35000000,
      utilized: 22500000,
      committed: 5500000,
      available: 7000000,
      percentage: 64.3
    }
  })
})

// Approval pending items
app.get('/pending-approvals', async (c) => {
  return c.json({
    approvals: [
      {
        id: '1',
        type: 'indent',
        reference: 'IND-2025-045',
        description: 'Spare parts for maintenance',
        amount: 85000,
        requestedBy: 'John Doe',
        pendingSince: '2 days',
        priority: 'high'
      },
      {
        id: '2',
        type: 'purchase_order',
        reference: 'PO-2025-048',
        description: 'Annual maintenance contract',
        amount: 450000,
        requestedBy: 'Jane Smith',
        pendingSince: '1 day',
        priority: 'normal'
      },
      {
        id: '3',
        type: 'vendor',
        reference: 'VEN-2025-015',
        description: 'New vendor registration - Tech Solutions',
        requestedBy: 'Procurement Team',
        pendingSince: '3 days',
        priority: 'normal'
      }
    ]
  })
})

export default app