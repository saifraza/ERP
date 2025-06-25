import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Mail, Clock, CheckCircle, Send, 
  AlertCircle, MessageSquare, Eye, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface EmailLog {
  id: string
  emailType: string
  subject: string
  toEmail: string
  status: string
  sentAt: string
  openedAt?: string
  responseReceivedAt?: string
  vendor: {
    name: string
    email: string
  }
}

export default function RFQEmailHistoryStandalone() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [rfqNumber, setRfqNumber] = useState<string>('')

  useEffect(() => {
    if (id) {
      fetchEmailLogs()
    }
  }, [id])

  const fetchEmailLogs = async () => {
    try {
      setLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      // Get email logs
      const response = await fetch(`${apiUrl}/api/rfq-email-history/${id}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch email logs')

      const data = await response.json()
      setEmailLogs(data.emailLogs || [])
      
      // Try to get RFQ number from URL or fallback
      const rfqParam = new URLSearchParams(window.location.search).get('rfq')
      setRfqNumber(rfqParam || `RFQ-${id.slice(0, 8)}`)
    } catch (error) {
      console.error('Error fetching email logs:', error)
      toast.error('Failed to load email history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'opened':
        return <Eye className="h-4 w-4 text-purple-600" />
      case 'responded':
        return <MessageSquare className="h-4 w-4 text-indigo-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email History - {rfqNumber}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track all email communications for this RFQ
              </p>
            </div>
          </div>
          <button
            onClick={fetchEmailLogs}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Email logs or empty state */}
      {emailLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No email history yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Email logs will appear here once you send RFQs to vendors
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Email Communications
            </h2>
            
            <div className="space-y-4">
              {emailLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {log.subject}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {log.emailType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          To: {log.vendor.name} ({log.toEmail})
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Sent: {new Date(log.sentAt).toLocaleString()}</span>
                          {log.openedAt && (
                            <span>Opened: {new Date(log.openedAt).toLocaleString()}</span>
                          )}
                          {log.responseReceivedAt && (
                            <span className="text-green-600">
                              Response: {new Date(log.responseReceivedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}