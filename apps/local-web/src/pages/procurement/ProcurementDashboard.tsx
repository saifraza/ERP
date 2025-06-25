import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, TrendingUp, Package, Clock, CheckCircle,
  AlertCircle, FileText, Users, DollarSign, BarChart3,
  ArrowRight, Calendar, Activity, ShoppingCart, ClipboardList,
  Calculator, Receipt, IndianRupee, Truck, ArrowUpRight,
  ArrowDownRight, Minus, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface ProcurementStats {
  requisitions: {
    total: number
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
  rfqs: {
    total: number
    open: number
    closed: number
    awarded: number
  }
  purchaseOrders: {
    total: number
    pending: number
    confirmed: number
    partial: number
    completed: number
  }
  grn: {
    total: number
    pending: number
    completed: number
  }
  invoices: {
    total: number
    pending: number
    approved: number
    paid: number
  }
  vendors: {
    total: number
    active: number
    new: number
  }
  amounts: {
    totalPOValue: number
    pendingPayments: number
    completedPayments: number
    savingsAmount: number
  }
}

interface RecentDocument {
  id: string
  type: 'PR' | 'RFQ' | 'PO' | 'GRN' | 'Invoice'
  documentNo: string
  date: string
  status: string
  amount?: number
  vendor?: string
}

export default function ProcurementDashboard() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProcurementStats | null>(null)
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([])
  const [timeRange, setTimeRange] = useState('month') // week, month, quarter, year

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Simulate API call - replace with actual API endpoint
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/api/procurement/dashboard?range=${timeRange}`)
      
      // Mock data for now
      setStats({
        requisitions: {
          total: 156,
          draft: 12,
          submitted: 24,
          approved: 98,
          rejected: 22
        },
        rfqs: {
          total: 89,
          open: 15,
          closed: 68,
          awarded: 6
        },
        purchaseOrders: {
          total: 78,
          pending: 8,
          confirmed: 45,
          partial: 15,
          completed: 10
        },
        grn: {
          total: 65,
          pending: 20,
          completed: 45
        },
        invoices: {
          total: 72,
          pending: 18,
          approved: 34,
          paid: 20
        },
        vendors: {
          total: 234,
          active: 178,
          new: 12
        },
        amounts: {
          totalPOValue: 4567890,
          pendingPayments: 1234567,
          completedPayments: 2345678,
          savingsAmount: 345678
        }
      })

      setRecentDocs([
        { id: '1', type: 'PR', documentNo: 'REQ-202412-0001', date: '2024-12-26', status: 'Submitted', vendor: 'ABC Chemicals' },
        { id: '2', type: 'PO', documentNo: 'PO-202412-0045', date: '2024-12-26', status: 'Confirmed', amount: 125000, vendor: 'XYZ Industries' },
        { id: '3', type: 'Invoice', documentNo: 'INV-2024-0234', date: '2024-12-25', status: 'Pending', amount: 89000, vendor: 'DEF Supplies' },
        { id: '4', type: 'RFQ', documentNo: 'RFQ-202412-0023', date: '2024-12-25', status: 'Open', vendor: 'Multiple' },
        { id: '5', type: 'GRN', documentNo: 'GRN-202412-0067', date: '2024-12-24', status: 'Completed', vendor: 'PQR Trading' }
      ])
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (type: string, status: string) => {
    const colors: any = {
      PR: {
        Draft: 'bg-gray-100 text-gray-800',
        Submitted: 'bg-blue-100 text-blue-800',
        Approved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800'
      },
      PO: {
        Pending: 'bg-yellow-100 text-yellow-800',
        Confirmed: 'bg-green-100 text-green-800',
        Partial: 'bg-orange-100 text-orange-800',
        Completed: 'bg-blue-100 text-blue-800'
      },
      default: 'bg-gray-100 text-gray-800'
    }
    return colors[type]?.[status] || colors.default
  }

  const procurementStages = [
    { name: 'Requisition', icon: ClipboardList, count: stats?.requisitions.total || 0, color: 'text-blue-600' },
    { name: 'RFQ', icon: Calculator, count: stats?.rfqs.total || 0, color: 'text-purple-600' },
    { name: 'Purchase Order', icon: FileText, count: stats?.purchaseOrders.total || 0, color: 'text-green-600' },
    { name: 'Goods Receipt', icon: Package, count: stats?.grn.total || 0, color: 'text-orange-600' },
    { name: 'Invoice', icon: Receipt, count: stats?.invoices.total || 0, color: 'text-red-600' },
    { name: 'Payment', icon: IndianRupee, count: stats?.invoices.paid || 0, color: 'text-indigo-600' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Procurement Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of procurement cycle and document status</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Link to="/procurement/requisitions" className="btn-primary">
            Create Requisition
          </Link>
        </div>
      </div>

      {/* Procurement Cycle Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Procurement Cycle</h2>
        <div className="relative">
          <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"></div>
          <div className="relative grid grid-cols-6 gap-4">
            {procurementStages.map((stage, index) => (
              <div key={stage.name} className="flex flex-col items-center">
                <div className={`relative z-10 h-16 w-16 bg-white dark:bg-gray-800 rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center ${stage.color}`}>
                  <stage.icon className="h-8 w-8" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{stage.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stage.count}</p>
                {index < procurementStages.length - 1 && (
                  <ChevronRight className="absolute top-8 -right-2 h-6 w-6 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total PO Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ₹{stats?.amounts.totalPOValue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <Minus className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ₹{stats?.amounts.pendingPayments.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 mt-2">{stats?.invoices.pending} invoices</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.vendors.active}
          </p>
          <p className="text-xs text-green-600 mt-2">+{stats?.vendors.new} new this month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ₹{stats?.amounts.savingsAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-600 mt-2">7.5% of total spend</p>
        </div>
      </div>

      {/* Document Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requisitions Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Requisitions</h3>
            <Link to="/procurement/requisitions" className="text-sm text-primary-600 hover:text-primary-700">
              View All <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Draft</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.requisitions.draft}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${(stats?.requisitions.draft! / stats?.requisitions.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.requisitions.submitted}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats?.requisitions.submitted! / stats?.requisitions.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.requisitions.approved}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats?.requisitions.approved! / stats?.requisitions.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.requisitions.rejected}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(stats?.requisitions.rejected! / stats?.requisitions.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Orders Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Orders</h3>
            <Link to="/procurement/purchase-orders" className="text-sm text-primary-600 hover:text-primary-700">
              View All <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.purchaseOrders.pending}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(stats?.purchaseOrders.pending! / stats?.purchaseOrders.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.purchaseOrders.confirmed}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats?.purchaseOrders.confirmed! / stats?.purchaseOrders.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Partial Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.purchaseOrders.partial}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${(stats?.purchaseOrders.partial! / stats?.purchaseOrders.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.purchaseOrders.completed}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats?.purchaseOrders.completed! / stats?.purchaseOrders.total!) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Documents</h3>
            <Link to="/procurement/documents" className="text-sm text-primary-600 hover:text-primary-700">
              View All <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{doc.type}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{doc.documentNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(doc.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {doc.vendor}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.type, doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {doc.amount ? `₹${doc.amount.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/procurement/${doc.type.toLowerCase()}s/${doc.id}`} className="text-primary-600 hover:text-primary-700">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/procurement/requisitions" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Requisition</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Start procurement process</p>
            </div>
          </div>
        </Link>

        <Link to="/procurement/vendors" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Manage Vendors</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">View vendor directory</p>
            </div>
          </div>
        </Link>

        <Link to="/procurement/rfqs" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">RFQ Management</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">View open RFQs</p>
            </div>
          </div>
        </Link>

        <Link to="/procurement/invoices" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Pending Invoices</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Process vendor bills</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}