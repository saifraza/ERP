import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, Users, FileText, ShoppingCart, DollarSign, AlertCircle, 
  Clock, CheckCircle, Package, ArrowRight, Calendar, BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardData {
  summary: {
    vendors: { total: number; active: number; pending: number; blacklisted: number }
    indents: { total: number; pending: number; approved: number; converted: number }
    rfqs: { active: number; responsePending: number; underEvaluation: number }
    purchaseOrders: { thisMonth: number; value: number; pending: number; delivered: number }
    payments: { due: number; overdue: number; processed: number }
  }
  alerts: Array<{ type: string; message: string; count: number; link: string }>
  recentActivity: Array<{ id: string; type: string; description: string; amount?: number; user: string; timestamp: string }>
  upcomingDeliveries: Array<{ poNumber: string; vendor: string; deliveryDate: string; items: number; value: number }>
  cashFlow: { week: { inflow: number; outflow: number; net: number }; month: { inflow: number; outflow: number; net: number } }
  topVendors: Array<{ name: string; thisMonth: number; ytd: number; rating: number }>
}

export default function FinanceDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/finance/dashboard`)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Procurement to payment overview</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/finance/indents/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Indent
          </Link>
          <Link
            to="/finance/vendors/new"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Add Vendor
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-gray-500">Vendors</span>
          </div>
          <p className="text-2xl font-bold">{dashboardData.summary.vendors.active}</p>
          <p className="text-sm text-gray-600">Active vendors</p>
          <Link to="/finance/vendors" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 text-green-600" />
            <span className="text-sm text-gray-500">Indents</span>
          </div>
          <p className="text-2xl font-bold">{dashboardData.summary.indents.pending}</p>
          <p className="text-sm text-gray-600">Pending approval</p>
          <Link to="/finance/indents" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
            Review <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-8 w-8 text-purple-600" />
            <span className="text-sm text-gray-500">RFQs</span>
          </div>
          <p className="text-2xl font-bold">{dashboardData.summary.rfqs.active}</p>
          <p className="text-sm text-gray-600">Active RFQs</p>
          <Link to="/finance/rfq" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
            Manage <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 text-orange-600" />
            <span className="text-sm text-gray-500">POs</span>
          </div>
          <p className="text-2xl font-bold">{dashboardData.summary.purchaseOrders.thisMonth}</p>
          <p className="text-sm text-gray-600">This month</p>
          <p className="text-sm font-medium text-gray-900">{formatCurrency(dashboardData.summary.purchaseOrders.value)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-red-600" />
            <span className="text-sm text-gray-500">Payments</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData.summary.payments.due)}</p>
          <p className="text-sm text-gray-600">Due amount</p>
          {dashboardData.summary.payments.overdue > 0 && (
            <p className="text-sm text-red-600 font-medium">{formatCurrency(dashboardData.summary.payments.overdue)} overdue</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Alerts & Notifications</h3>
          <div className="space-y-2">
            {dashboardData.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm text-gray-700">{alert.message}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                    {alert.count}
                  </span>
                </div>
                <Link to={alert.link} className="text-sm text-primary-600 hover:text-primary-700">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  {activity.amount && (
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(activity.amount)}</p>
                  )}
                  <p className="text-xs text-gray-500">{activity.user} • {new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Upcoming Deliveries</h3>
          <div className="space-y-3">
            {dashboardData.upcomingDeliveries.map((delivery, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{delivery.poNumber}</p>
                    <p className="text-sm text-gray-600">{delivery.vendor}</p>
                    <p className="text-xs text-gray-500">{delivery.items} items • {formatCurrency(delivery.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{delivery.deliveryDate}</p>
                    <p className="text-xs text-gray-500">
                      {Math.ceil((new Date(delivery.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Cash Flow</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">This Week</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Outflow</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(dashboardData.cashFlow.week.outflow)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Net</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(dashboardData.cashFlow.week.net)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">This Month</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Outflow</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(dashboardData.cashFlow.month.outflow)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Net</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(dashboardData.cashFlow.month.net)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Vendors */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Top Vendors</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">This Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YTD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.topVendors.map((vendor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(vendor.thisMonth)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(vendor.ytd)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">⭐ {vendor.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}