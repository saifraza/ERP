import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ClipboardList, Plus, Search, Filter, Calendar,
  Clock, AlertCircle, CheckCircle, XCircle, Send,
  Eye, Edit, MoreVertical, Package, Building,
  TrendingUp, FileText, ArrowRight, User, Shield,
  MoreHorizontal
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import AddRequisitionModal from '../../components/procurement/AddRequisitionModal'
import PRWorkflowInfo from '../../components/procurement/PRWorkflowInfo'
import PRStatusSummary from '../../components/procurement/PRStatusSummary'
import { useKeyboardShortcuts, useListNavigation, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts'
import DenseTable, { Column } from '../../components/DenseTable'

interface RequisitionItem {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  materialDescription?: string
  quantity: number
  unit: string
  requiredDate: string
  specification?: string
  remarks?: string
}

interface Requisition {
  id: string
  requisitionNo: string
  requisitionDate: string
  factory: { name: string; code: string }
  division?: { name: string; code: string }
  department: string
  requestedBy: string
  approvedBy?: string
  approvedDate?: string
  priority: string
  purpose?: string
  status: string
  items: RequisitionItem[]
  totalItems: number
  poCount: number
  createdAt: string
  updatedAt: string
  remarks?: string
}

export default function PurchaseRequisitions() {
  const { token, user } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPRs, setSelectedPRs] = useState<string[]>([])
  
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    fetchRequisitions()
  }, [currentCompany, selectedStatus, selectedPriority])

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedPriority !== 'all') params.append('priority', selectedPriority)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRequisitions(data.requisitions || [])
      } else {
        console.error('Error response:', response.status, response.statusText)
        toast.error('Failed to load requisitions')
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error)
      toast.error('Failed to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return <Clock className="h-4 w-4" />
      case 'SUBMITTED':
        return <Send className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      case 'PARTIALLY_ORDERED':
      case 'ORDERED':
        return <ArrowRight className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'PARTIALLY_ORDERED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'ORDERED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'text-red-600 dark:text-red-400'
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400'
      case 'NORMAL':
        return 'text-blue-600 dark:text-blue-400'
      case 'LOW':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600'
    }
  }

  const formatSpecification = (spec: string | undefined): string => {
    if (!spec) return ''
    
    try {
      const parsed = JSON.parse(spec)
      // Just show the quantity and unit for the list view
      return `${parsed.technicalGrade || ''}`
    } catch {
      // If it's not JSON, return as is
      return spec
    }
  }

  const handleSubmitPR = async (prId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${prId}/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        toast.success('PR submitted for approval')
        fetchRequisitions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit PR')
      }
    } catch (error) {
      toast.error('Failed to submit PR')
    }
  }

  const handleApprovePR = async (prId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${prId}/approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      )

      if (response.ok) {
        toast.success('PR approved successfully')
        fetchRequisitions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve PR')
      }
    } catch (error) {
      toast.error('Failed to approve PR')
    }
  }

  const handleRejectPR = async (prId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${prId}/approval`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'REJECTED', remarks: reason }),
        }
      )

      if (response.ok) {
        toast.success('PR rejected')
        fetchRequisitions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject PR')
      }
    } catch (error) {
      toast.error('Failed to reject PR')
    }
  }

  const prColumns: Column<Requisition>[] = [
    {
      key: 'requisition',
      header: 'Requisition',
      width: '20%',
      sortable: true,
      render: (pr) => (
        <div>
          <p className="cell-primary">{pr.requisitionNo}</p>
          <p className="cell-secondary">{new Date(pr.requisitionDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (pr) => (
        <div className="flex items-center gap-2">
          <span className={`status-pill ${getStatusColor(pr.status)}`}>
            {getStatusIcon(pr.status)}
            <span className="ml-1">{pr.status.toLowerCase()}</span>
          </span>
          {pr.status.toUpperCase() === 'SUBMITTED' && isManager && (
            <span className="status-pill bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              <Shield className="h-3 w-3" />
            </span>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '8%',
      sortable: true,
      render: (pr) => (
        <span className={`text-xs font-medium ${getPriorityColor(pr.priority)}`}>
          {pr.priority.toUpperCase()}
        </span>
      )
    },
    {
      key: 'division',
      header: 'Division',
      width: '15%',
      render: (pr) => (
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{pr.division?.name || pr.department || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      width: '12%',
      render: (pr) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{pr.requestedBy}</span>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      width: '25%',
      render: (pr) => (
        <div className="space-y-0.5">
          {pr.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Package className="h-3 w-3" />
              <span className="truncate">
                {item.materialCode} - {item.quantity} {item.unit}
              </span>
            </div>
          ))}
          {pr.items.length > 2 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              +{pr.items.length - 2} more
            </p>
          )}
        </div>
      )
    },
    {
      key: 'poStatus',
      header: 'PO Status',
      width: '8%',
      render: (pr) => (
        pr.poCount > 0 ? (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {pr.poCount} PO{pr.poCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Requisitions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage material requisitions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
          data-new-requisition
        >
          <Plus className="h-4 w-4" />
          Create PR
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total PRs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isManager ? 'Awaiting Your Approval' : 'Pending Approval'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.filter(pr => pr.status.toUpperCase() === 'SUBMITTED').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              {isManager ? (
                <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.filter(pr => pr.status.toUpperCase() === 'APPROVED').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Urgent PRs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.filter(pr => pr.priority.toUpperCase() === 'URGENT').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
          </div>
        </div>
        
        {/* Status Summary */}
        <div className="lg:col-span-1">
          <PRStatusSummary />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PR number or description..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                data-search-pr
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PARTIALLY_ORDERED">Partially Ordered</option>
            <option value="ORDERED">Fully Ordered</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* PRs List */}
      <DenseTable<Requisition>
        data={requisitions}
        columns={prColumns}
        loading={loading}
        rowKey={(pr) => pr.id}
        onRowClick={(pr) => navigate(`/procurement/requisitions/${pr.id}`)}
        selectedRows={selectedPRs}
        onSelectRow={(id) => setSelectedPRs(prev => 
          prev.includes(id) ? prev.filter(prId => prId !== id) : [...prev, id]
        )}
        onSelectAll={(selected) => setSelectedPRs(selected ? requisitions.map(pr => pr.id) : [])}
        rowActions={(pr) => (
          <>
            {pr.status.toUpperCase() === 'DRAFT' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleSubmitPR(pr.id)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Submit for approval"
              >
                <Send className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </button>
            )}
            {pr.status.toUpperCase() === 'SUBMITTED' && isManager && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApprovePR(pr.id)
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRejectPR(pr.id)
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </>
            )}
            {pr.status.toUpperCase() === 'APPROVED' && pr.poCount === 0 && (
              <Link
                to={`/procurement/requisitions/${pr.id}/convert-to-rfq`}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={(e) => e.stopPropagation()}
                title="Convert to RFQ"
              >
                <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Link>
            )}
            <Link
              to={`/procurement/requisitions/${pr.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
              title="View details"
            >
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Link>
            {pr.status.toUpperCase() === 'DRAFT' && (
              <button 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={(e) => e.stopPropagation()}
                title="Edit"
              >
                <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <button 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}
        emptyMessage="No purchase requisitions found"
      />

      {/* Workflow Information */}
      {requisitions.some(pr => pr.status.toUpperCase() === 'DRAFT' || pr.status.toUpperCase() === 'SUBMITTED') && (
        <PRWorkflowInfo />
      )}

      {/* Add Requisition Modal */}
      <AddRequisitionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchRequisitions()
        }}
      />
    </div>
  )
}