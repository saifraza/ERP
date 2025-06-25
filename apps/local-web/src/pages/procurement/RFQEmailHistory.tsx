import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Mail, Send, CheckCircle, Clock, 
  AlertCircle, FileText, RefreshCw, Eye, 
  MessageSquare, BarChart3, Users
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import RFQEmailPreview from '../../components/procurement/RFQEmailPreview'

interface EmailLog {
  id: string
  emailType: string
  subject: string
  toEmail: string
  status: string
  sentAt: string
  vendor: {
    name: string
    code: string
  }
}

interface EmailResponse {
  id: string
  fromEmail: string
  subject: string
  receivedAt: string
  processingStatus: string
  quotationId?: string
  vendor: {
    name: string
    code: string
  }
}

interface VendorCommunication {
  vendor: any
  emailSent: boolean
  emailSentAt?: string
  responseReceived: boolean
  quotationReceivedAt?: string
  reminderCount: number
  lastReminderAt?: string
  totalEmails: number
  lastEmail?: EmailLog
  hasResponse: boolean
}

export default function RFQEmailHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [communicationSummary, setCommunicationSummary] = useState<VendorCommunication[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [emailResponses, setEmailResponses] = useState<EmailResponse[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [selectedVendorForReminder, setSelectedVendorForReminder] = useState<any>(null)

  useEffect(() => {
    fetchEmailHistory()
  }, [id])

  const fetchEmailHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/rfqs/${id}/email-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch email history')

      const data = await response.json()
      setRfq(data.rfq)
      setCommunicationSummary(data.communicationSummary)
      setEmailLogs(data.emailLogs)
      setEmailResponses(data.emailResponses)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching email history:', error)
      toast.error('Failed to load email history')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessEmails = async () => {
    setProcessing(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/rfq-emails/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to process emails')

      const result = await response.json()
      toast.success(`Processed ${result.processed} emails`)
      fetchEmailHistory() // Refresh data
    } catch (error) {
      console.error('Error processing emails:', error)
      toast.error('Failed to process emails')
    } finally {
      setProcessing(false)
    }
  }

  const handleSendReminder = async (vendorId: string) => {
    try {
      // Find the vendor and show email preview
      const vendor = communicationSummary.find(c => c.vendor.id === vendorId)?.vendor
      if (!vendor) {
        toast.error('Vendor not found')
        return
      }
      
      setSelectedVendorForReminder(vendor)
      setShowEmailPreview(true)
    } catch (error) {
      console.error('Error preparing reminder:', error)
      toast.error('Failed to prepare reminder')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const filteredLogs = selectedVendor 
    ? emailLogs.filter(log => log.vendor.code === selectedVendor)
    : emailLogs

  const filteredResponses = selectedVendor
    ? emailResponses.filter(res => res.vendor.code === selectedVendor)
    : emailResponses

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/procurement/rfqs/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQ Details
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RFQ Email Communication</h1>
            <p className="text-sm text-gray-600 mt-1">
              RFQ #{rfq?.rfqNumber} - Email tracking and vendor responses
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleProcessEmails}
              disabled={processing}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Process New Emails
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEmailsSent || 0}</p>
            </div>
            <Send className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Responses Received</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalResponsesReceived || 0}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalVendors > 0 
                  ? Math.round((stats.responsesReceived / stats.emailsSent) * 100)
                  : 0}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Vendor Communication Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Communication Status</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reminders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Communication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {communicationSummary.map((comm) => (
                  <tr 
                    key={comm.vendor.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedVendor === comm.vendor.code ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedVendor(comm.vendor.code === selectedVendor ? null : comm.vendor.code)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{comm.vendor.name}</div>
                        <div className="text-xs text-gray-500">{comm.vendor.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comm.emailSent ? (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Sent
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          Not Sent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comm.hasResponse ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {comm.reminderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comm.lastEmail ? new Date(comm.lastEmail.sentAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!comm.hasResponse && comm.emailSent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendReminder(comm.vendor.id)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Logs and Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sent Emails */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sent Emails {selectedVendor && `(${selectedVendor})`}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No emails sent</p>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-blue-200 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.subject}</p>
                        <p className="text-xs text-gray-500">To: {log.toEmail}</p>
                        <p className="text-xs text-gray-500">
                          Type: {log.emailType.replace('_', ' ')} • {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Received Responses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Vendor Responses {selectedVendor && `(${selectedVendor})`}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredResponses.length === 0 ? (
                <p className="text-sm text-gray-500">No responses received</p>
              ) : (
                filteredResponses.map((response) => (
                  <div key={response.id} className="border-l-2 border-green-200 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{response.subject}</p>
                        <p className="text-xs text-gray-500">From: {response.fromEmail}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.receivedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {response.quotationId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Quotation Created
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          response.processingStatus === 'processed' ? 'bg-green-100 text-green-800' :
                          response.processingStatus === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {response.processingStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Preview Modal for Reminders */}
      {showEmailPreview && selectedVendorForReminder && rfq && (
        <RFQEmailPreview
          rfqId={rfq.id}
          rfqNumber={rfq.rfqNumber}
          vendors={[selectedVendorForReminder]}
          onClose={() => {
            setShowEmailPreview(false)
            setSelectedVendorForReminder(null)
          }}
          onEmailSent={() => {
            setShowEmailPreview(false)
            setSelectedVendorForReminder(null)
            fetchEmailHistory() // Refresh data
          }}
          isReminder={true}
        />
      )}
    </div>
  )
}