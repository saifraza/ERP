import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { Mail, RefreshCw, Settings, Play, Pause, Filter, FileText, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  conditions: any
  actions: string[]
}

interface ProcessingResult {
  emailId: string
  subject: string
  from: string
  processedAt: string
  status: 'completed' | 'failed'
  extractedData?: any
  actions: string[]
  error?: string
}

export default function EmailAutomation() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'templates' | 'history'>('dashboard')
  const [processing, setProcessing] = useState(false)
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [history, setHistory] = useState<ProcessingResult[]>([])
  const [stats, setStats] = useState({
    totalProcessed: 0,
    successRate: 0,
    avgProcessingTime: 0,
    pendingEmails: 0
  })

  useEffect(() => {
    loadRules()
    loadHistory()
  }, [currentCompany])

  const loadRules = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-automation/rules`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-automation/history?companyId=${currentCompany?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        
        // Calculate stats
        const total = data.history.length
        const successful = data.history.filter((h: any) => h.status === 'completed').length
        setStats({
          totalProcessed: total,
          successRate: total > 0 ? (successful / total) * 100 : 0,
          avgProcessingTime: 2.5, // Mock data
          pendingEmails: 5 // Mock data
        })
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const processBatch = async () => {
    setProcessing(true)
    
    // Debug logging
    console.log('Current company:', currentCompany)
    console.log('Company ID:', currentCompany?.id)
    console.log('Token exists:', !!token)
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-automation/process-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyId: currentCompany?.id || null,
            maxResults: 10
            // Removed query due to Gmail scope limitations
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.processed === 0) {
          toast('No unread emails found to process', {
            icon: '📧',
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          })
        } else {
          toast.success(`Processed ${data.processed} emails`)
        }
        loadHistory()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Server error response:', errorData)
        console.error('Response status:', response.status)
        throw new Error(errorData.error || errorData.details || 'Failed to process emails')
      }
    } catch (error: any) {
      console.error('Process batch error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast.error(error.message || 'Failed to process emails')
    } finally {
      setProcessing(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const rule = rules.find(r => r.id === ruleId)
      if (!rule) return
      
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-automation/rules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...rule,
            enabled
          })
        }
      )
      
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r))
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error('Failed to update rule')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="h-7 w-7 text-indigo-600" />
                Email Automation
              </h1>
              <p className="text-gray-600 mt-1">Automate vendor email processing and document extraction</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={processBatch}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Process Emails
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/email-automation/debug/list-emails`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          companyId: currentCompany?.id,
                          maxResults: 5
                        })
                      }
                    )
                    const data = await response.json()
                    console.log('Debug list emails result:', data)
                    if (data.success) {
                      toast.success(`Found ${data.count} emails`)
                    } else {
                      toast.error(data.error || 'Failed to list emails')
                    }
                  } catch (error) {
                    console.error('Debug error:', error)
                    toast.error('Failed to test email listing')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Mail className="h-4 w-4" />
                Test List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Emails</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingEmails}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Automation Rules
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Email Templates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Processing History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Recent Processing Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Processing</h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((result) => (
                  <div key={result.emailId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{result.subject}</p>
                        <p className="text-sm text-gray-600">From: {result.from}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(result.processedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {result.actions.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Rules</h3>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Actions: {rule.actions.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      rule.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900">Invoice Acknowledgment</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically sent when an invoice is received from a vendor
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900">Purchase Order Confirmation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Sent to confirm receipt of customer purchase orders
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900">Payment Notification</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Inform vendors when payments have been processed
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((result) => (
                  <tr key={result.emailId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.subject}</p>
                        <p className="text-sm text-gray-500">{result.from}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        result.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.actions.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.processedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}