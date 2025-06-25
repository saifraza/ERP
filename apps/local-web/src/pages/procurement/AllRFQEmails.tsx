import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Mail, Send, CheckCircle, Clock, 
  AlertCircle, FileText, RefreshCw, 
  MessageSquare, BarChart3, Users, Search
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface RFQSummary {
  id: string
  rfqNumber: string
  status: string
  issueDate: string
  vendorCount: number
  emailsSent: number
  responsesReceived: number
}

export default function AllRFQEmails() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [rfqs, setRfqs] = useState<RFQSummary[]>([])
  const [selectedRfq, setSelectedRfq] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/rfq-email-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch RFQs')

      const data = await response.json()
      
      // Transform RFQ data to include email summary
      const rfqSummaries = data.rfqs.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        status: rfq.status,
        issueDate: rfq.issueDate,
        vendorCount: rfq.vendors?.length || 0,
        emailsSent: rfq.vendors?.filter((v: any) => v.emailSent).length || 0,
        responsesReceived: rfq.vendors?.filter((v: any) => v.responseReceived).length || 0
      }))
      
      setRfqs(rfqSummaries)
    } catch (error) {
      console.error('Error fetching RFQs:', error)
      toast.error('Failed to load RFQs')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessAllEmails = async () => {
    setProcessing(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/rfq-email-history/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to process emails')

      const result = await response.json()
      toast.success(`Processed ${result.processed} emails`)
      fetchRFQs() // Refresh data
    } catch (error) {
      console.error('Error processing emails:', error)
      toast.error('Failed to process emails')
    } finally {
      setProcessing(false)
    }
  }

  const filteredRfqs = rfqs.filter(rfq => 
    rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RFQ Email Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track all RFQ email communications across vendors
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleProcessAllEmails}
              disabled={processing}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Process All Emails
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total RFQs</p>
              <p className="text-2xl font-bold text-gray-900">{rfqs.length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.reduce((sum, rfq) => sum + rfq.vendorCount, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.reduce((sum, rfq) => sum + rfq.emailsSent, 0)}
              </p>
            </div>
            <Send className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Responses Received</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.reduce((sum, rfq) => sum + rfq.responsesReceived, 0)}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by RFQ number..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* RFQ List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RFQ Email Status</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFQ Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendors
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emails Sent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRfqs.map((rfq) => {
                  const responseRate = rfq.emailsSent > 0 
                    ? Math.round((rfq.responsesReceived / rfq.emailsSent) * 100)
                    : 0
                    
                  return (
                    <tr key={rfq.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rfq.rfqNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rfq.status === 'sent' ? 'bg-green-100 text-green-800' :
                          rfq.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rfq.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {rfq.vendorCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {rfq.emailsSent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {rfq.responsesReceived}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          responseRate >= 75 ? 'bg-green-100 text-green-800' :
                          responseRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {responseRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/procurement/rfqs/${rfq.id}`)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View RFQ
                          </button>
                          <span className="text-gray-400">|</span>
                          <button
                            onClick={() => window.open(`/procurement/rfqs/${rfq.id}/email-history`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Email History
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}