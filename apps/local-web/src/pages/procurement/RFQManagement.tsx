import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Calculator, Send, Clock, CheckCircle, XCircle,
  Eye, Mail, Calendar, Users, Package, FileText,
  BarChart3, AlertCircle, Building2, IndianRupee,
  TrendingUp, ArrowRight, MoreVertical
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import { RFQPDFViewer } from '../../components/procurement/RFQPDFViewer'
import { useKeyboardShortcuts, useListNavigation } from '../../hooks/useKeyboardShortcuts'

interface RFQItem {
  id: string
  itemCode: string
  itemDescription: string
  quantity: number
  unit: string
}

interface RFQVendor {
  id: string
  vendorId: string
  emailSent: boolean
  responseReceived: boolean
}

interface RFQ {
  id: string
  rfqNumber: string
  issueDate: string
  submissionDeadline: string
  status: string
  requisition?: {
    requisitionNo: string
    division: { name: string }
  }
  vendors: RFQVendor[]
  items: RFQItem[]
  _count: { quotations: number }
}

export default function RFQManagement() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedRFQs, setSelectedRFQs] = useState<string[]>([])

  useEffect(() => {
    fetchRFQs()
  }, [currentCompany, selectedStatus])

  const fetchRFQs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRFQs(data.rfqs || [])
      }
    } catch (error) {
      console.error('Error fetching RFQs:', error)
      toast.error('Failed to load RFQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRFQ = async (rfqId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'RFQ sent to vendors')
        fetchRFQs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send RFQ')
      }
    } catch (error) {
      toast.error('Failed to send RFQ')
    }
  }

  const handleCloseRFQ = async (rfqId: string) => {
    if (!confirm('Are you sure you want to close this RFQ?')) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/close`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        toast.success('RFQ closed successfully')
        fetchRFQs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to close RFQ')
      }
    } catch (error) {
      toast.error('Failed to close RFQ')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'SENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysRemaining = (submissionDeadline: string) => {
    const due = new Date(submissionDeadline)
    const today = new Date()
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }
  
  // Simple shortcuts without command key
  const pageShortcuts = [
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('[data-search-rfq]') as HTMLInputElement
        searchInput?.focus()
      }
    }
  ]
  
  useKeyboardShortcuts(pageShortcuts, [selectedRFQs, rfqs, navigate])
  
  // List navigation
  const { selectedIndex } = useListNavigation(
    rfqs,
    (rfq, index) => {
      setSelectedRFQs(prev => 
        prev.includes(rfq.id) 
          ? prev.filter(id => id !== rfq.id)
          : [...prev, rfq.id]
      )
    },
    (rfq) => navigate(`/procurement/rfqs/${rfq.id}`)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RFQ Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Request for Quotations from vendors</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/procurement/requisitions"
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Create from PR
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total RFQs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {rfqs.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active RFQs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {rfqs.filter(rfq => rfq.status === 'SENT').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {rfqs.reduce((sum, rfq) => sum + rfq._count.quotations, 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {rfqs.filter(rfq => 
                  rfq.status === 'SENT' && getDaysRemaining(rfq.submissionDeadline) <= 3
                ).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="SENT">Sent</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* RFQs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              Loading RFQs...
            </div>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <Calculator className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No RFQs found</p>
            <Link 
              to="/procurement/requisitions"
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Create from PR
            </Link>
          </div>
        ) : (
          rfqs.map((rfq) => (
            <div key={rfq.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Calculator className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {rfq.rfqNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                          {rfq.status}
                        </span>
                        {rfq.requisition && (
                          <Link
                            to={`/procurement/requisitions/${rfq.requisition.requisitionNo}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            From {rfq.requisition.requisitionNo}
                          </Link>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Issued {new Date(rfq.issueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {new Date(rfq.submissionDeadline).toLocaleDateString()}
                          {rfq.status === 'SENT' && (
                            <span className={`ml-1 font-medium ${
                              getDaysRemaining(rfq.submissionDeadline) <= 3 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              ({getDaysRemaining(rfq.submissionDeadline)} days)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RFQPDFViewer 
                      rfqId={rfq.id}
                      rfqNumber={rfq.rfqNumber}
                      onEmailSent={fetchRFQs}
                      rfqData={rfq}
                    />
                    {rfq.status === 'SENT' && rfq._count.quotations > 0 && (
                      <Link
                        to={`/procurement/rfqs/${rfq.id}/comparison`}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        Compare
                      </Link>
                    )}
                    {rfq.status === 'SENT' && (
                      <button 
                        onClick={() => handleCloseRFQ(rfq.id)}
                        className="btn-secondary text-sm"
                      >
                        Close RFQ
                      </button>
                    )}
                    <Link
                      to={`/procurement/rfqs/${rfq.id}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                    {(rfq.status === 'SENT' || rfq.status === 'sent') && (
                      <Link
                        to={`/procurement/rfqs/${rfq.id}/email-history`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Email History"
                      >
                        <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Link>
                    )}
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Vendor Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rfq.vendors.length}
                      </p>
                      {rfq.vendors.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {rfq.vendors.slice(0, 2).map((v: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {v.vendor?.email || 'No email'}
                            </p>
                          ))}
                          {rfq.vendors.length > 2 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              +{rfq.vendors.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Emails Sent</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rfq.vendors.filter(v => v.emailSent).length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Responses</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rfq._count.quotations}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rfq.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{item.itemDescription}</span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                    {rfq.items.length > 2 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        +{rfq.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}