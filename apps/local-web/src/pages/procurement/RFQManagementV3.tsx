import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Send, Clock, CheckCircle, XCircle, Eye, Mail, 
  Calendar, Users, Package, BarChart3, AlertCircle, Plus,
  Download, RefreshCw, Filter, Search, Printer, Edit,
  MessageSquare, TrendingUp, User, Phone, Building,
  ChevronRight, Hash, MapPin, CreditCard, FileCheck,
  ChevronDown, ChevronUp, Inbox, Paperclip, MailCheck,
  MailX, History, ArrowDownToLine, ArrowUpFromLine
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

interface EmailLog {
  id: string
  rfqId: string
  vendorId: string
  emailType: string
  subject: string
  toEmail?: string
  fromEmail?: string
  ccEmails?: string
  status: string
  sentAt?: string
  receivedAt?: string
  error?: string
  attachments?: string
  snippet?: string
  quotationId?: string
  vendor?: {
    name: string
    code: string
  }
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

export default function RFQManagementV3() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRFQs, setSelectedRFQs] = useState<string[]>([])
  const [sendingRFQ, setSendingRFQ] = useState<string | null>(null)
  const [expandedRFQ, setExpandedRFQ] = useState<string | null>(null)
  const [emailLogs, setEmailLogs] = useState<{ [key: string]: EmailLog[] }>({})
  const [loadingEmailLogs, setLoadingEmailLogs] = useState<string | null>(null)

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

  const fetchEmailLogs = async (rfqId: string) => {
    if (emailLogs[rfqId]) return // Already loaded
    
    setLoadingEmailLogs(rfqId)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/email-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        // Combine emailLogs and emailResponses for display
        const allLogs = [...(data.emailLogs || []), ...(data.emailResponses || [])]
          .sort((a, b) => {
            const dateA = new Date(a.sentAt || a.receivedAt || 0).getTime()
            const dateB = new Date(b.sentAt || b.receivedAt || 0).getTime()
            return dateB - dateA
          })
        setEmailLogs(prev => ({ ...prev, [rfqId]: allLogs }))
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to load email history')
      }
    } catch (error) {
      console.error('Error fetching email logs:', error)
      toast.error('Failed to load email history')
    } finally {
      setLoadingEmailLogs(null)
    }
  }

  const toggleEmailHistory = async (rfqId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    if (expandedRFQ === rfqId) {
      setExpandedRFQ(null)
    } else {
      setExpandedRFQ(rfqId)
      await fetchEmailLogs(rfqId)
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
        // Refresh email logs if expanded
        if (expandedRFQ === rfqId) {
          setEmailLogs(prev => ({ ...prev, [rfqId]: [] }))
          await fetchEmailLogs(rfqId)
        }
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

  const handleResendEmail = async (rfqId: string, vendorId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    if (!confirm('Resend RFQ email to this vendor?')) return
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vendorIds: [vendorId] })
        }
      )

      if (response.ok) {
        toast.success('Email resent successfully!')
        fetchRFQs()
        // Refresh email logs
        setEmailLogs(prev => ({ ...prev, [rfqId]: [] }))
        await fetchEmailLogs(rfqId)
      } else {
        toast.error('Failed to resend email')
      }
    } catch (error) {
      toast.error('Failed to resend email')
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

  const getEmailStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <MailCheck className="h-4 w-4 text-green-600" />
      case 'failed':
        return <MailX className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const getDaysRemaining = (submissionDeadline: string) => {
    const due = new Date(submissionDeadline)
    const today = new Date()
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const viewPDF = async (rfqId: string, rfqNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to load PDF')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // Create a direct window.open with the blob URL
      // This should trigger the browser's PDF viewer directly
      const pdfWindow = window.open(url, '_blank')
      
      if (!pdfWindow) {
        // Fallback: create a link and click it
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.error('PDF view error:', error)
      toast.error('Failed to view PDF')
    }
  }

  const downloadPDF = async (rfqId: string, rfqNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `RFQ_${rfqNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download PDF')
    }
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
              
              <button
                onClick={(e) => toggleEmailHistory(rfq.id, e)}
                className={`p-1 text-xs rounded flex items-center gap-1 ${
                  expandedRFQ === rfq.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={expandedRFQ === rfq.id ? "Hide email history" : "Show email history"}
              >
                <History className="h-3 w-3" />
                {expandedRFQ === rfq.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
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

      {/* RFQs Table with Email History */}
      <div className="space-y-1">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading RFQs...
            </div>
          </div>
        ) : filteredRFQs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No RFQs found</p>
            <Link
              to="/procurement/requisitions"
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create RFQ from PR
            </Link>
          </div>
        ) : (
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
        )}

        {/* Email History Expanded Section */}
        {expandedRFQ && (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Communication History - {rfqs.find(r => r.id === expandedRFQ)?.rfqNumber}
              </h3>
              <button
                onClick={() => setExpandedRFQ(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {loadingEmailLogs === expandedRFQ ? (
              <div className="text-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Loading email history...</p>
              </div>
            ) : emailLogs[expandedRFQ]?.length > 0 ? (
              <div className="space-y-2">
                {emailLogs[expandedRFQ].map((log) => (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {log.receivedAt ? (
                            <Inbox className="h-4 w-4 text-blue-600" />
                          ) : (
                            getEmailStatusIcon(log.status)
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.receivedAt ? 'Vendor Reply' :
                             log.emailType === 'rfq_sent' ? 'RFQ Sent' :
                             log.emailType === 'quotation_received' ? 'Quotation Received' :
                             log.emailType === 'reminder_sent' ? 'Reminder Sent' :
                             'Email'}
                          </span>
                          {log.receivedAt ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Received
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              log.status === 'sent' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{log.vendor?.name}</span>
                            <span>({log.toEmail || log.fromEmail || 'Email'})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {(log.sentAt || log.receivedAt) 
                                ? new Date(log.sentAt || log.receivedAt || '').toLocaleString('en-IN') 
                                : 'Not sent'}
                            </span>
                          </div>
                          {log.subject && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-3 w-3 mt-0.5" />
                              <span className="font-medium">Subject: {log.subject}</span>
                            </div>
                          )}
                          {log.snippet && (
                            <div className="flex items-start gap-2">
                              <FileText className="h-3 w-3 mt-0.5" />
                              <span className="italic">"{log.snippet}..."</span>
                            </div>
                          )}
                          {log.attachments && (
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-3 w-3" />
                              <span>{JSON.parse(log.attachments).join(', ')}</span>
                            </div>
                          )}
                          {log.error && (
                            <div className="flex items-start gap-2 text-red-600">
                              <AlertCircle className="h-3 w-3 mt-0.5" />
                              <span>{log.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {log.status === 'failed' && (
                          <button
                            onClick={(e) => handleResendEmail(expandedRFQ, log.vendorId, e)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            title="Resend email"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Resend
                          </button>
                        )}
                        {log.receivedAt && log.quotationId && (
                          <Link
                            to={`/procurement/quotations/${log.quotationId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
                            title="View quotation"
                          >
                            <Eye className="h-3 w-3" />
                            View Quote
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No email communication history available.
              </p>
            )}

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <ArrowUpFromLine className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Emails Sent</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {emailLogs[expandedRFQ]?.filter(l => l.sentAt && !l.receivedAt && l.status === 'sent').length || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <ArrowDownToLine className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Responses</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {emailLogs[expandedRFQ]?.filter(l => l.receivedAt && !l.sentAt).length || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {emailLogs[expandedRFQ]?.filter(l => l.status === 'failed').length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

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
              <p className="font-medium">Send & Track</p>
              <p className="text-blue-600 dark:text-blue-400">
                Send RFQ to vendors and monitor email history inline
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