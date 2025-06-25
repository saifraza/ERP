import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, Clock, CheckCircle, XCircle, User, Calendar,
  Building, Package, AlertCircle, Filter, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import PRApprovalModal from '../../components/procurement/PRApprovalModal'

interface PendingRequisition {
  id: string
  requisitionNo: string
  requisitionDate: string
  factory: { name: string; code: string }
  division?: { name: string; code: string }
  department: string
  requestedBy: string
  priority: string
  purpose?: string
  status: string
  items: Array<{
    id: string
    materialCode: string
    materialName: string
    quantity: number
    unit: string
    requiredDate: string
  }>
  totalItems: number
  createdAt: string
}

export default function PendingApprovals() {
  const { token, user } = useAuthStore()
  const [requisitions, setRequisitions] = useState<PendingRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PendingRequisition | null>(null)

  // Check if user is a manager
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    if (isManager) {
      fetchPendingRequisitions()
    }
  }, [selectedPriority, isManager])

  const fetchPendingRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('status', 'SUBMITTED')
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
        toast.error('Failed to load pending approvals')
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
      toast.error('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      case 'HIGH':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
      case 'NORMAL':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
      case 'LOW':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const handleApprovalClick = (pr: PendingRequisition) => {
    setSelectedPR(pr)
    setShowApprovalModal(true)
  }

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Restricted</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Only managers can access the approval page
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve purchase requisitions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
            {requisitions.length} pending
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.filter(pr => pr.priority.toUpperCase() === 'HIGH').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Oldest PR</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {requisitions.length > 0 ? getDaysAgo(requisitions[requisitions.length - 1].createdAt) : '-'}
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent Only</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Pending PRs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              Loading pending approvals...
            </div>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No pending approvals</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All requisitions have been reviewed</p>
          </div>
        ) : (
          requisitions.map((pr) => (
            <div key={pr.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {pr.requisitionNo}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(pr.priority)}`}>
                          {pr.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {pr.requestedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {pr.division?.name || pr.department || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Submitted {getDaysAgo(pr.createdAt)}
                        </div>
                      </div>
                      {pr.purpose && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Purpose:</span> {pr.purpose}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovalClick(pr)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Review & Approve
                    </button>
                    <Link
                      to={`/procurement/requisitions/${pr.id}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Link>
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
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.materialCode} - {item.materialName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Due: {new Date(item.requiredDate).toLocaleDateString()}
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {selectedPR && (
        <PRApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedPR(null)
          }}
          pr={{
            id: selectedPR.id,
            requisitionNo: selectedPR.requisitionNo,
            requisitionDate: selectedPR.requisitionDate,
            department: selectedPR.department,
            priority: selectedPR.priority,
            purpose: selectedPR.purpose,
            requestedBy: selectedPR.requestedBy,
            requestedByEmail: '',  // Not available in list view
            factory: selectedPR.factory,
            division: selectedPR.division,
            items: selectedPR.items.map(item => ({
              material: {
                code: item.materialCode,
                name: item.materialName,
                unit: item.unit
              },
              quantity: item.quantity
            }))
          }}
          token={token || ''}
          onSuccess={() => {
            setShowApprovalModal(false)
            setSelectedPR(null)
            fetchPendingRequisitions()
            toast.success('Decision recorded successfully')
          }}
        />
      )}
    </div>
  )
}