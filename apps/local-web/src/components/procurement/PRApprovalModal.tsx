import { useState } from 'react'
import { Check, X, AlertCircle, MessageSquare, User, Building, Calendar, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PRApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  pr: {
    id: string
    requisitionNo: string
    requisitionDate: string
    department: string
    priority: string
    purpose?: string
    requestedBy: string
    requestedByEmail: string
    factory: {
      name: string
      code: string
    }
    division?: {
      name: string
      code: string
    }
    items: Array<{
      material: {
        code: string
        name: string
        unit: string
      }
      quantity: number
    }>
  }
  token: string
  onSuccess: () => void
}

export default function PRApprovalModal({ isOpen, onClose, pr, token, onSuccess }: PRApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    // Validation: remarks are mandatory for rejection
    if (action === 'reject' && !remarks.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject'
      const body = action === 'approve' 
        ? { remarks: remarks.trim() || undefined }
        : { reason: remarks.trim() }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${pr.id}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body)
        }
      )

      if (response.ok) {
        toast.success(`Purchase requisition ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to ${action} purchase requisition`)
      }
    } catch (error) {
      console.error(`Error ${action}ing PR:`, error)
      toast.error(`Failed to ${action} purchase requisition`)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[priority.toLowerCase() as keyof typeof colors] || colors.normal
  }

  // Calculate total items and quantities
  const totalItems = pr.items.length
  const totalQuantity = pr.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-gray-900/75 transition-opacity" 
          onClick={onClose} 
        />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review Purchase Requisition
            </h3>
          </div>

          {/* PR Details */}
          <div className="p-6 space-y-6">
            {/* PR Summary */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pr.requisitionNo}
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(pr.priority)}`}>
                  {pr.priority} Priority
                </span>
              </div>
              
              {pr.purpose && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {pr.purpose}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Requested by</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{pr.requestedBy}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {pr.division?.name || pr.department}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Request Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(pr.requisitionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Items</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {totalItems} items ({totalQuantity} units)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Items Summary</h5>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {pr.items.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {item.material.code} - {item.material.name}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                          {item.quantity} {item.material.unit}
                        </td>
                      </tr>
                    ))}
                    {pr.items.length > 5 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400 italic">
                          ... and {pr.items.length - 5} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Decision <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAction('approve')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    action === 'approve' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Check className={`h-5 w-5 mx-auto mb-1 ${
                    action === 'approve' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    action === 'approve' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Approve
                  </p>
                </button>
                
                <button
                  onClick={() => setAction('reject')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    action === 'reject' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <X className={`h-5 w-5 mx-auto mb-1 ${
                    action === 'reject' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    action === 'reject' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Reject
                  </p>
                </button>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    Remarks {action === 'reject' && <span className="text-red-500">*</span>}
                  </span>
                </div>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={action === 'approve' 
                  ? 'Add optional comments for the requester...' 
                  : 'Please provide a reason for rejection (required)...'}
              />
              {action === 'reject' && !remarks.trim() && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Rejection reason is mandatory
                </p>
              )}
            </div>

            {/* Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {action === 'approve' 
                    ? 'Once approved, this requisition can be converted to a Purchase Order.'
                    : 'Once rejected, the requester will be notified and can create a new requisition if needed.'}
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`flex items-center gap-2 ${
                action === 'approve' ? 'btn-primary' : 'btn-danger'
              }`}
              disabled={loading || (action === 'reject' && !remarks.trim())}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  {action === 'approve' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {action === 'approve' ? 'Approve PR' : 'Reject PR'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}