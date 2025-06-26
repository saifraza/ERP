import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Send, Clock, CheckCircle, XCircle, Eye, Mail, 
  Calendar, Users, Package, BarChart3, AlertCircle, Plus,
  Download, RefreshCw, Filter, Search, Printer, Edit,
  MessageSquare, TrendingUp, User, Phone, Building,
  ChevronRight, Hash, MapPin, CreditCard, FileCheck
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import DenseTable, { Column } from '../../components/DenseTable'

interface Vendor {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  contactPerson?: string
}

interface RFQVendor {
  id: string
  vendorId: string
  emailSent: boolean
  emailSentAt?: string
  responseReceived: boolean
  vendor: Vendor
}

interface RFQItem {
  id: string
  itemCode: string
  itemDescription: string
  quantity: number
  unit: string
  specification?: string
}

interface RFQ {
  id: string
  rfqNumber: string
  issueDate: string
  submissionDeadline: string
  status: string
  priority?: string
  requisition?: {
    id: string
    requisitionNo: string
    division: { name: string }
    department?: string
  }
  vendors: RFQVendor[]
  items: RFQItem[]
  _count: { 
    quotations: number
    vendors: number
  }
  createdBy?: {
    name: string
    email: string
  }
}

export default function RFQManagementV2() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRFQs, setSelectedRFQs] = useState<string[]>([])
  const [sendingRFQ, setSendingRFQ] = useState<string | null>(null)

  useEffect(() => {
    fetchRFQs()
  }, [currentCompany, selectedStatus])

  const fetchRFQs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchQuery) params.append('search', searchQuery)

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
        console.log('RFQs data:', data)
        setRFQs(data.rfqs || [])
      } else {
        toast.error('Failed to load RFQs')
      }
    } catch (error) {
      console.error('Error fetching RFQs:', error)
      toast.error('Failed to load RFQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRFQ = async (rfqId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    if (!confirm('Send RFQ to all vendors via email?')) return
    
    setSendingRFQ(rfqId)
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
        toast.success(`RFQ sent to ${data.sentCount} vendors successfully!`)
        fetchRFQs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send RFQ')
      }
    } catch (error) {
      toast.error('Failed to send RFQ')
    } finally {
      setSendingRFQ(null)
    }
  }

  const handleCloseRFQ = async (rfqId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    if (!confirm('Are you sure you want to close this RFQ? No more quotations will be accepted.')) return

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
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
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

  const viewPDF = (rfqId: string, rfqNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    window.open(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/pdf/view`, '_blank')
  }

  const downloadPDF = (rfqId: string, rfqNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const link = document.createElement('a')
    link.href = `${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/pdf/view`
    link.download = `RFQ_${rfqNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const rfqColumns: Column<RFQ>[] = [
    {
      key: 'rfq',
      header: 'RFQ Details',
      width: '20%',
      sortable: true,
      render: (rfq) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-gray-400" />
            <span className="cell-primary font-medium">{rfq.rfqNumber}</span>
          </div>
          {rfq.requisition && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="cell-secondary text-xs">PR: {rfq.requisition.requisitionNo}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-gray-400" />
            <span className="cell-secondary text-xs">{rfq.requisition?.division?.name || 'General'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (rfq) => (
        <div className="space-y-1">
          <span className={`status-pill ${getStatusColor(rfq.status)}`}>
            {rfq.status === 'SENT' && <Send className="h-3 w-3 inline mr-1" />}
            {rfq.status === 'CLOSED' && <XCircle className="h-3 w-3 inline mr-1" />}
            {rfq.status === 'OPEN' && <Clock className="h-3 w-3 inline mr-1" />}
            {rfq.status.toLowerCase()}
          </span>
          {rfq.priority && (
            <span className={`text-xs ${
              rfq.priority === 'URGENT' ? 'text-red-600' : 
              rfq.priority === 'HIGH' ? 'text-orange-600' : 'text-gray-600'
            }`}>
              {rfq.priority}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'timeline',
      header: 'Timeline',
      width: '15%',
      render: (rfq) => {
        const daysLeft = getDaysRemaining(rfq.submissionDeadline)
        const isOverdue = daysLeft < 0
        const isDueSoon = daysLeft >= 0 && daysLeft <= 3
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span>Issued: {new Date(rfq.issueDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'
            }`}>
              <Clock className="h-3 w-3" />
              <span>Due: {new Date(rfq.submissionDeadline).toLocaleDateString('en-IN')}</span>
              {rfq.status === 'SENT' && (
                <span className="font-medium">
                  ({isOverdue ? 'Overdue' : `${daysLeft} days`})
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'vendors',
      header: 'Vendors & Responses',
      width: '25%',
      render: (rfq) => (
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3 text-gray-400" />
              <span>{rfq.vendors.length} vendors</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3 text-gray-400" />
              <span>{rfq.vendors.filter(v => v.emailSent).length} sent</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <FileCheck className="h-3 w-3 text-gray-400" />
              <span>{rfq._count.quotations} quotes</span>
            </div>
          </div>
          {rfq.vendors.length > 0 && (
            <div className="mt-1">
              {rfq.vendors.slice(0, 2).map((v, idx) => (
                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  <span className="font-medium">{v.vendor?.name || 'Unknown'}</span>
                  {v.vendor?.email && (
                    <span className="text-gray-500"> - {v.vendor.email}</span>
                  )}
                  {v.emailSent && (
                    <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                  )}
                </div>
              ))}
              {rfq.vendors.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{rfq.vendors.length - 2} more vendors
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      width: '15%',
      render: (rfq) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium">
            <Package className="h-3 w-3 text-gray-400" />
            <span>{rfq.items.length} items</span>
          </div>
          {rfq.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-xs text-gray-600 truncate">
              {item.itemDescription}
            </div>
          ))}
          {rfq.items.length > 2 && (
            <div className="text-xs text-gray-500">
              +{rfq.items.length - 2} more
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '15%',
      render: (rfq) => (
        <div className="flex items-center gap-1 flex-wrap">
          {rfq.status === 'OPEN' && (
            <button
              onClick={(e) => handleSendRFQ(rfq.id, e)}
              disabled={sendingRFQ === rfq.id}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
              title="Send RFQ to vendors via email"
            >
              {sendingRFQ === rfq.id ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Send to Vendors
            </button>
          )}
          
          {rfq.status === 'SENT' && rfq._count.quotations > 0 && (
            <Link
              to={`/procurement/rfqs/${rfq.id}/comparison`}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
              title="Compare quotations"
            >
              <BarChart3 className="h-3 w-3" />
              Compare
            </Link>
          )}
          
          {rfq.status === 'SENT' && (
            <>
              <button
                onClick={(e) => handleCloseRFQ(rfq.id, e)}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
                title="Close RFQ"
              >
                <XCircle className="h-3 w-3" />
                Close
              </button>
              
              <Link
                to={`/procurement/rfqs/${rfq.id}/email-history`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                title="View email history"
              >
                <Mail className="h-3 w-3" />
              </Link>
            </>
          )}
          
          <button
            onClick={(e) => viewPDF(rfq.id, rfq.rfqNumber, e)}
            className="p-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="View PDF"
          >
            <Eye className="h-3 w-3" />
          </button>
          
          <button
            onClick={(e) => downloadPDF(rfq.id, rfq.rfqNumber, e)}
            className="p-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="Download PDF"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      )
    }
  ]

  const filteredRFQs = rfqs.filter(rfq => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      rfq.rfqNumber.toLowerCase().includes(query) ||
      rfq.requisition?.requisitionNo.toLowerCase().includes(query) ||
      rfq.vendors.some(v => 
        v.vendor?.name?.toLowerCase().includes(query) ||
        v.vendor?.email?.toLowerCase().includes(query)
      )
    )
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RFQ Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage Request for Quotations and track vendor responses
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchRFQs()}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            to="/procurement/requisitions"
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Create RFQ
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total RFQs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {rfqs.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Open RFQs</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {rfqs.filter(rfq => rfq.status === 'OPEN').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-300 dark:text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Sent RFQs</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {rfqs.filter(rfq => rfq.status === 'SENT').length}
              </p>
            </div>
            <Send className="h-8 w-8 text-green-300 dark:text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {rfqs.reduce((sum, rfq) => sum + rfq._count.quotations, 0)}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-purple-300 dark:text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {rfqs.filter(rfq => 
                  rfq.status === 'SENT' && getDaysRemaining(rfq.submissionDeadline) <= 3 && getDaysRemaining(rfq.submissionDeadline) >= 0
                ).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-300 dark:text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by RFQ number, PR number, vendor name or email..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="SENT">Sent</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* RFQs Table */}
      <DenseTable<RFQ>
        data={filteredRFQs}
        columns={rfqColumns}
        loading={loading}
        rowKey={(rfq) => rfq.id}
        onRowClick={(rfq) => navigate(`/procurement/rfqs/${rfq.id}`)}
        selectedRows={selectedRFQs}
        onSelectRow={(id) => setSelectedRFQs(prev => 
          prev.includes(id) ? prev.filter(rfqId => rfqId !== id) : [...prev, id]
        )}
        onSelectAll={(selected) => setSelectedRFQs(selected ? filteredRFQs.map(rfq => rfq.id) : [])}
        emptyMessage="No RFQs found. Create one from an approved Purchase Requisition."
        className="shadow-sm"
      />

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          RFQ Workflow Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <div className="bg-blue-200 dark:bg-blue-800 rounded-full p-1 mt-0.5">
              <span className="block w-4 h-4 text-center leading-4 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium">Create RFQ</p>
              <p className="text-blue-600 dark:text-blue-400">
                Convert approved PR to RFQ and select vendors
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-blue-200 dark:bg-blue-800 rounded-full p-1 mt-0.5">
              <span className="block w-4 h-4 text-center leading-4 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">Send to Vendors</p>
              <p className="text-blue-600 dark:text-blue-400">
                Click "Send to Vendors" to email RFQ with PDF attachment
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-blue-200 dark:bg-blue-800 rounded-full p-1 mt-0.5">
              <span className="block w-4 h-4 text-center leading-4 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium">Compare & Select</p>
              <p className="text-blue-600 dark:text-blue-400">
                Compare quotations and create PO for selected vendors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}