import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, Plus, Search, Filter, Calendar,
  Clock, AlertCircle, CheckCircle, XCircle, Send,
  Eye, Edit, MoreVertical, Package, Building,
  TrendingUp, FileText, ArrowRight, User, Shield
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import AddRequisitionModal from '../../components/procurement/AddRequisitionModal'
import PRWorkflowInfo from '../../components/procurement/PRWorkflowInfo'

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
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
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
        >
          <Plus className="h-4 w-4" />
          Create PR
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              Loading purchase requisitions...
            </div>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <ClipboardList className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No purchase requisitions found</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn-primary"
            >
              Create First PR
            </button>
          </div>
        ) : (
          requisitions.map((pr) => (
            <div key={pr.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {pr.requisitionNo}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
                          {getStatusIcon(pr.status)}
                          {pr.status.toLowerCase()}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(pr.priority)}`}>
                          {pr.priority.toUpperCase()}
                        </span>
                        {pr.status.toUpperCase() === 'SUBMITTED' && isManager && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <Shield className="h-3 w-3" />
                            Needs approval
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {pr.division?.name || pr.department || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {pr.requestedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created on {new Date(pr.requisitionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pr.status.toUpperCase() === 'DRAFT' && (
                      <button 
                        onClick={() => handleSubmitPR(pr.id)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Submit
                      </button>
                    )}
                    {pr.status.toUpperCase() === 'APPROVED' && pr.poCount === 0 && (
                      <Link
                        to={`/procurement/requisitions/${pr.id}/convert-to-rfq`}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Convert to RFQ
                      </Link>
                    )}
                    <Link
                      to={`/procurement/requisitions/${pr.id}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                    {pr.status.toUpperCase() === 'DRAFT' && (
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {pr.items.length} item{pr.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pr.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.materialCode} {item.materialName ? `- ${item.materialName}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                    {pr.items.length > 3 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        +{pr.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* RFQ Status */}
                {pr.poCount > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {pr.poCount} PO{pr.poCount !== 1 ? 's' : ''} created
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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