import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Package, Calendar, User, Building,
  FileText, Check, X, Clock, Edit, Trash,
  Send, AlertCircle, Download,
  Printer, MessageSquare, History, ShoppingCart,
  Shield
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import PRApprovalModal from '../../components/procurement/PRApprovalModal'

interface PRItem {
  id: string
  materialId: string
  material: {
    id: string
    code: string
    name: string
    description?: string
    unit: string
    specifications?: string
    category?: string
    criticalItem?: boolean
    reorderLevel?: number
    leadTimeDays?: number
  }
  quantity: number
  requiredDate: string
  specification?: string
  remarks?: string
}

interface PurchaseRequisition {
  id: string
  requisitionNo: string
  requisitionDate: string
  department: string
  priority: string
  purpose?: string
  status: string
  requestedBy: string
  requestedByEmail: string
  approvedBy?: string
  approvedByEmail?: string
  approvedDate?: string
  remarks?: string
  factory: {
    name: string
    code: string
  }
  division?: {
    name: string
    code: string
  }
  items: PRItem[]
  purchaseOrders?: any[]
  createdAt: string
  updatedAt: string
}

export default function PurchaseRequisitionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [pr, setPr] = useState<PurchaseRequisition | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  useEffect(() => {
    fetchPRDetails()
  }, [id])

  const fetchPRDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPr(data.requisition)
      } else {
        toast.error('Failed to load PR details')
      }
    } catch (error) {
      console.error('Error fetching PR details:', error)
      toast.error('Failed to load PR details')
    } finally {
      setLoading(false)
    }
  }

  // Check if user has permission to approve
  const canUserApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[priority.toLowerCase() as keyof typeof colors] || colors.medium
  }

  const parseSpecification = (spec: string | undefined): string => {
    if (!spec) return '-'
    
    try {
      const parsed = JSON.parse(spec)
      const parts: string[] = []
      
      if (parsed.technicalGrade) parts.push(`Grade: ${parsed.technicalGrade}`)
      if (parsed.complianceStandard) parts.push(`Standard: ${parsed.complianceStandard}`)
      if (parsed.storageConditions) parts.push(`Storage: ${parsed.storageConditions}`)
      if (parsed.shelfLife) parts.push(`Shelf Life: ${parsed.shelfLife} years`)
      
      return parts.length > 0 ? parts.join(' • ') : spec
    } catch {
      return spec
    }
  }

  const canApprove = pr?.status.toUpperCase() === 'SUBMITTED' && canUserApprove
  const canEdit = pr?.status.toUpperCase() === 'DRAFT'
  const canConvertToPO = pr?.status.toUpperCase() === 'APPROVED' && (!pr.purchaseOrders || pr.purchaseOrders.length === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!pr) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Purchase requisition not found</p>
        <button
          onClick={() => navigate('/procurement/requisitions')}
          className="mt-4 btn-primary"
        >
          Back to PRs
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/procurement/requisitions')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pr.requisitionNo}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
                {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(pr.priority)}`}>
                {pr.priority.charAt(0).toUpperCase() + pr.priority.slice(1)} Priority
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{pr.purpose || 'Purchase Requisition'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {canEdit && (
            <>
              <button className="btn-secondary flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                <Trash className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          {pr?.status.toUpperCase() === 'SUBMITTED' && (
            canUserApprove ? (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Review & Approve
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-300">
                  Pending approval from manager
                </span>
              </div>
            )
          )}
          {canConvertToPO && (
            <button className="btn-primary flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Convert to PO
            </button>
          )}
          <button className="btn-secondary flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* PR Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requestor</p>
              <p className="font-medium text-gray-900 dark:text-white">{pr.requestedBy}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{pr.requestedByEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Division</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{pr.division?.name || pr.department}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{pr.factory.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created On</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(pr.requisitionDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {Math.ceil((new Date().getTime() - new Date(pr.requisitionDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {pr.items.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Line items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Required By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pr.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.material.code} - {item.material.name}
                      </p>
                      {item.material.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {item.material.description}
                        </p>
                      )}
                      {item.specification && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Specs: {parseSpecification(item.specification)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.quantity} {item.material.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.requiredDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {item.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval History */}
      {(pr.approvedBy || pr.status.toUpperCase() === 'CANCELLED') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Approval History
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${
                pr.status.toUpperCase() === 'APPROVED' 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {pr.status.toUpperCase() === 'APPROVED' ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pr.status.toUpperCase() === 'APPROVED' ? 'Approved' : 'Rejected'} by {pr.approvedBy || 'Manager'}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    Manager
                  </span>
                </div>
                {pr.approvedDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(pr.approvedDate).toLocaleString()}
                  </p>
                )}
                {pr.remarks && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {pr.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {pr && (
        <PRApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          pr={pr}
          token={token || ''}
          onSuccess={fetchPRDetails}
        />
      )}
    </div>
  )
}