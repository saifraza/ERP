import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { Mail, RefreshCw, Send, Search, Paperclip, Calendar, AlertCircle, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Email {
  id: string
  subject: string
  from: string
  date: string
  account?: string // Which email account this came from
}

interface EmailAccount {
  id: string
  emailAddress: string
  provider: string
}

interface CalendarEvent {
  id: string
  summary: string
  start: any
  end: any
  location?: string
}

export default function Mails() {
  const { user, token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [emails, setEmails] = useState<Email[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'emails' | 'calendar'>('emails')
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  
  // For MCP testing
  const [mcpResponse, setMcpResponse] = useState<any>(null)
  const [mcpError, setMcpError] = useState<string>('')

  // Load email accounts on mount
  useEffect(() => {
    if (currentCompany) {
      loadEmailAccounts()
    }
  }, [currentCompany])

  const loadEmailAccounts = async () => {
    if (!currentCompany) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/accounts/${currentCompany.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to load email accounts')

      const data = await response.json()
      setEmailAccounts(data.accounts || [])
    } catch (err) {
      console.error('Failed to load email accounts:', err)
    }
  }

  // This will connect to your MCP server through the API
  const callMCP = async (tool: string, args: any) => {
    try {
      setLoading(true)
      setMcpError('')
      
      // Map tool names to API actions
      const actionMap: Record<string, string> = {
        'list_emails': 'list-emails',
        'send_email': 'send-email',
        'list_events': 'list-events'
      }
      
      const action = actionMap[tool] || tool
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
      
      // Use multi-tenant endpoint if company is selected
      const endpoint = currentCompany 
        ? `${apiUrl}/api/mcp/company/${currentCompany.id}/gmail/${action}`
        : `${apiUrl}/api/mcp/gmail/${action}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(args)
      })

      if (!response.ok) throw new Error('Failed to call MCP')
      
      const data = await response.json()
      setMcpResponse(data)
      
      // Parse response based on tool
      if (data.success && data.data) {
        if (tool === 'list_emails') {
          setEmails(data.data)
        } else if (tool === 'list_events') {
          setEvents(data.data)
        }
      }
      
      toast.success(`${tool.replace('_', ' ')} executed successfully`)
    } catch (error: any) {
      console.error('MCP Error:', error)
      setMcpError(error.message || 'Failed to connect to MCP server')
      toast.error('Failed to connect to MCP server')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = () => {
    callMCP('list_emails', { maxResults: 20, query: searchQuery })
  }

  const fetchCalendarEvents = () => {
    callMCP('list_events', { maxResults: 10 })
  }

  const sendTestEmail = () => {
    callMCP('send_email', {
      to: user?.email || 'test@example.com',
      subject: 'Test from ERP System',
      body: '<h1>Test Email</h1><p>This is a test email sent from the ERP system using MCP Gmail integration.</p>'
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary-600" />
          Gmail Integration Test
        </h1>
        <p className="text-gray-600 mt-2">Test MCP server Gmail integration</p>
      </div>

      {/* MCP Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">MCP Server Status</h3>
        <div className="text-sm">
          <p className="text-gray-600">
            MCP Server URL: <span className="font-mono">https://mcp-server-production-ac21.up.railway.app</span>
          </p>
          {mcpError && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {mcpError}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('emails')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'emails'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          Emails
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Calendar
        </button>
      </div>

      {activeTab === 'emails' && (
        <div>
          {/* Account Selector */}
          {emailAccounts.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Email Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Connected Accounts ({emailAccounts.length})</option>
                {emailAccounts.map((account) => (
                  <option key={account.id} value={account.emailAddress}>
                    {account.emailAddress}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                No email accounts connected. 
                <a href="/settings/email" className="ml-1 font-medium underline">
                  Connect an email account
                </a>
                {' '}to start viewing emails.
              </p>
            </div>
          )}

          {/* Email Controls */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchEmails()}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Fetch Emails
            </button>
            <button
              onClick={sendTestEmail}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send Test
            </button>
          </div>

          {/* Email List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No emails loaded</p>
                <p className="text-sm mt-1">Click "Fetch Emails" to load your Gmail messages</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{email.subject || '(No Subject)'}</h4>
                        <p className="text-sm text-gray-600 mt-1">{email.from}</p>
                        {email.account && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {email.account}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{email.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          {/* Calendar Controls */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={fetchCalendarEvents}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Fetch Events
            </button>
          </div>

          {/* Event List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No calendar events loaded</p>
                <p className="text-sm mt-1">Click "Fetch Events" to load your calendar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {events.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium text-gray-900">{event.summary}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Start: {new Date(event.start.dateTime || event.start.date).toLocaleString()}</p>
                      {event.location && <p>Location: {event.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {mcpResponse && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">MCP Response (Debug)</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(mcpResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}