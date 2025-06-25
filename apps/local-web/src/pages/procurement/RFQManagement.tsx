import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Calculator, Send, Clock, CheckCircle, XCircle,
  Eye, Mail, Calendar, Users, Package, FileText,
  BarChart3, AlertCircle, Building2, IndianRupee,
  TrendingUp, ArrowRight, MoreVertical, MoreHorizontal
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import { RFQPDFViewer } from '../../components/procurement/RFQPDFViewer'
import { useKeyboardShortcuts, useListNavigation } from '../../hooks/useKeyboardShortcuts'
import DenseTable, { Column } from '../../components/DenseTable'

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
    switch (status.toUpperCase()) {
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
  
  const rfqColumns: Column<RFQ>[] = [
    {
      key: 'rfq',
      header: 'RFQ Number',
      width: '15%',
      sortable: true,
      render: (rfq) => (
        <div>
          <p className="cell-primary">{rfq.rfqNumber}</p>
          {rfq.requisition && (
            <p className="cell-secondary text-xs">
              From {rfq.requisition.requisitionNo}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (rfq) => (
        <span className={`status-pill ${getStatusColor(rfq.status)}`}>
          {rfq.status.toLowerCase()}
        </span>
      )
    },
    {
      key: 'dates',
      header: 'Timeline',
      width: '18%',
      render: (rfq) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Issued: {new Date(rfq.issueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Due: {new Date(rfq.submissionDeadline).toLocaleDateString()}</span>
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
      )
    },
    {
      key: 'vendors',
      header: 'Vendors',
      width: '20%',
      render: (rfq) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs">{rfq.vendors.length} vendors</span>
          </div>
          {rfq.vendors.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {rfq.vendors.slice(0, 2).map((v: any, idx: number) => (
                <div key={idx} className="truncate">
                  {v.vendor?.name || v.vendor?.email || 'Unknown'}
                </div>
              ))}
              {rfq.vendors.length > 2 && (
                <div>+{rfq.vendors.length - 2} more</div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'responses',
      header: 'Responses',
      width: '12%',
      render: (rfq) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="text-xs">{rfq.vendors.filter(v => v.emailSent).length} sent</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-gray-400" />
            <span className="text-xs">{rfq._count.quotations} received</span>
          </div>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      width: '25%',
      render: (rfq) => (
        <div className="space-y-0.5">
          {rfq.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Package className="h-3 w-3" />
              <span className="truncate">
                {item.itemDescription} - {item.quantity} {item.unit}
              </span>
            </div>
          ))}
          {rfq.items.length > 2 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              +{rfq.items.length - 2} more
            </p>
          )}
        </div>
      )
    }
  ]

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
      <DenseTable<RFQ>
        data={rfqs}
        columns={rfqColumns}
        loading={loading}
        rowKey={(rfq) => rfq.id}
        onRowClick={(rfq) => navigate(`/procurement/rfqs/${rfq.id}`)}
        selectedRows={selectedRFQs}
        onSelectRow={(id) => setSelectedRFQs(prev => 
          prev.includes(id) ? prev.filter(rfqId => rfqId !== id) : [...prev, id]
        )}
        onSelectAll={(selected) => setSelectedRFQs(selected ? rfqs.map(rfq => rfq.id) : [])}
        rowActions={(rfq) => (
          <>
            <RFQPDFViewer 
              rfqId={rfq.id}
              rfqNumber={rfq.rfqNumber}
              onEmailSent={fetchRFQs}
              rfqData={rfq}
            />
            {rfq.status === 'SENT' && rfq._count.quotations > 0 && (
              <Link
                to={`/procurement/rfqs/${rfq.id}/comparison`}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={(e) => e.stopPropagation()}
                title="Compare quotations"
              >
                <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </Link>
            )}
            {rfq.status === 'SENT' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseRFQ(rfq.id)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Close RFQ"
              >
                <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <Link
              to={`/procurement/rfqs/${rfq.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
              title="View Details"
            >
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Link>
            {(rfq.status === 'SENT' || rfq.status === 'sent') && (
              <Link
                to={`/procurement/rfqs/${rfq.id}/email-history`}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={(e) => e.stopPropagation()}
                title="Email History"
              >
                <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Link>
            )}
            <button 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}
        emptyMessage="No RFQs found"
      />
    </div>
  )
}