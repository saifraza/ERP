import { useState, useEffect } from 'react'
import { ClipboardList, CheckCircle, XCircle, Clock, Send, ArrowRight, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface StatusStats {
  total: number
  draft: number
  submitted: number
  approved: number
  cancelled: number
  partially_ordered: number
  ordered: number
}

export default function PRStatusSummary() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<StatusStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    cancelled: 0,
    partially_ordered: 0,
    ordered: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllRequisitions()
  }, [])

  const fetchAllRequisitions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const requisitions = data.requisitions || []
        
        // Calculate stats
        const statusCounts: StatusStats = {
          total: requisitions.length,
          draft: 0,
          submitted: 0,
          approved: 0,
          cancelled: 0,
          partially_ordered: 0,
          ordered: 0
        }
        
        requisitions.forEach((pr: any) => {
          switch (pr.status.toUpperCase()) {
            case 'DRAFT':
              statusCounts.draft++
              break
            case 'SUBMITTED':
              statusCounts.submitted++
              break
            case 'APPROVED':
              statusCounts.approved++
              break
            case 'CANCELLED':
              statusCounts.cancelled++
              break
            case 'PARTIALLY_ORDERED':
              statusCounts.partially_ordered++
              break
            case 'ORDERED':
              statusCounts.ordered++
              break
          }
        })
        
        setStats(statusCounts)
      }
    } catch (error) {
      console.error('Error fetching requisition stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const getPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PR Status Overview</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <TrendingUp className="h-4 w-4" />
          Total: {stats.total}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Draft</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.draft}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${getPercentage(stats.draft)}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Submitted (Pending Approval)</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.submitted}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getPercentage(stats.submitted)}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.approved}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${getPercentage(stats.approved)}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Rejected/Cancelled</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.cancelled}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${getPercentage(stats.cancelled)}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Converted to PO</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.partially_ordered + stats.ordered}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(stats.partially_ordered + stats.ordered)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Summary:</strong> {stats.submitted} PR{stats.submitted !== 1 ? 's' : ''} awaiting approval, 
          {' '}{stats.approved} approved, {stats.cancelled} rejected
        </p>
      </div>
    </div>
  )
}