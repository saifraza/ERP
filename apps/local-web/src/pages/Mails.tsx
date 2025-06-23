import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { Mail, RefreshCw, Send, Search, Paperclip, Calendar, AlertCircle, User, Bot, Clock, Filter, Download, Eye, MessageSquare, Sparkles, LogOut, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Email {
  id: string
  subject: string
  from: string
  to?: string
  date: string
  snippet?: string
  hasAttachments?: boolean
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
  description?: string
}

export default function Mails() {
  const { user, token, logout } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [emails, setEmails] = useState<Email[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'emails' | 'calendar' | 'assistant'>('emails')
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  
  // AI Assistant state
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Hello! I can help you manage emails, schedule meetings, and analyze documents. What would you like to do?' }
  ])
  const [aiLoading, setAiLoading] = useState(false)

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
      
      console.log(`Calling MCP endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(args)
      })

      const data = await response.json()
      console.log('MCP Response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to call MCP')
      }
      
      // Parse response based on tool
      if (data.success && data.data) {
        if (tool === 'list_emails') {
          setEmails(data.data)
          toast.success(`Loaded ${data.data.length} emails`)
        } else if (tool === 'list_events') {
          setEvents(data.data)
          toast.success(`Loaded ${data.data.length} calendar events`)
        }
      } else if (data.success && tool === 'send_email') {
        toast.success('Email sent successfully')
      }
    } catch (error: any) {
      console.error('MCP Error:', error)
      const errorMessage = error.message || 'Failed to connect to email server'
      toast.error(errorMessage)
      
      // Provide helpful error messages
      if (errorMessage.includes('calendar')) {
        toast.error('Calendar access might not be enabled. Check your OAuth permissions.', {
          duration: 5000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = () => {
    callMCP('list_emails', { maxResults: 20, query: searchQuery })
  }

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      console.log('Fetching calendar events...')
      await callMCP('list_events', { maxResults: 10 })
    } catch (error) {
      console.error('Calendar fetch error:', error)
      toast.error('Failed to fetch calendar events. Make sure calendar access is enabled.')
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = () => {
    callMCP('send_email', {
      to: user?.email || 'test@example.com',
      subject: 'Test from ERP System',
      body: '<h1>Test Email</h1><p>This is a test email sent from the ERP system using Gmail integration.</p>'
    })
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return

    const userMessage = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setAiLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
      const response = await fetch(`${apiUrl}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          companyId: currentCompany?.id
        })
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      
      if (data.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
        
        // If the assistant fetched data, refresh the UI
        if (data.data) {
          if (userMessage.toLowerCase().includes('email')) {
            setEmails(data.data)
          } else if (userMessage.toLowerCase().includes('calendar') || userMessage.toLowerCase().includes('event')) {
            setEvents(data.data)
          }
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('AI Error:', error)
      toast.error('Failed to get AI response')
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="h-7 w-7 text-indigo-600" />
                Email & Calendar Hub
              </h1>
              <p className="text-gray-600 mt-1">Manage emails, calendar events, and use AI assistant</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/settings/email')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Account Status Bar */}
        {emailAccounts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Active Account:</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Accounts ({emailAccounts.length})</option>
                  {emailAccounts.map((account) => (
                    <option key={account.id} value={account.emailAddress}>
                      {account.emailAddress}
                    </option>
                  ))}
                </select>
              </div>
              <a 
                href="/settings/email" 
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Manage Accounts →
              </a>
            </div>
          </div>
        )}

        {/* No accounts message */}
        {emailAccounts.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-8 mb-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Mail className="h-16 w-16 text-indigo-600" />
                  <Bot className="h-8 w-8 text-purple-600 absolute -bottom-1 -right-1" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Email & Calendar Hub!</h3>
              <p className="text-gray-600 mb-6 text-lg">Connect your work email to unlock powerful features:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Mail className="h-6 w-6 text-indigo-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Email Management</h4>
                  <p className="text-sm text-gray-600 mt-1">Search, filter, and manage all your business emails</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Calendar Integration</h4>
                  <p className="text-sm text-gray-600 mt-1">View meetings and schedule events seamlessly</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Sparkles className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">AI Assistant</h4>
                  <p className="text-sm text-gray-600 mt-1">Get intelligent help with emails and documents</p>
                </div>
              </div>
              <a 
                href="/settings/email" 
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm"
              >
                <Mail className="h-5 w-5 mr-2" />
                Connect Your Work Email
              </a>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex-1 px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'emails'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Mail className="h-4 w-4" />
              Emails
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'calendar'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 relative ${
                activeTab === 'assistant'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Bot className="h-4 w-4" />
              AI Assistant
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Email Tab */}
        {activeTab === 'emails' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Actions */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchEmails()}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={fetchEmails}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={sendTestEmail}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Test
                  </button>
                </div>
              </div>

              {/* Email List */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {emails.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No emails loaded</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Refresh" to load emails</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {emails.map((email) => (
                      <div 
                        key={email.id} 
                        onClick={() => setSelectedEmail(email)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {email.subject || '(No Subject)'}
                              </h4>
                              {email.hasAttachments && (
                                <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 truncate">{email.from}</p>
                            {email.snippet && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{email.snippet}</p>
                            )}
                            {email.account && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {email.account}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0 text-right">
                            <span className="text-xs text-gray-500">
                              {new Date(email.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedEmail ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedEmail.subject}</h3>
                  <p className="text-sm text-gray-600 mb-4">From: {selectedEmail.from}</p>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{selectedEmail.snippet || 'Email content preview...'}</p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      <Eye className="h-3 w-3" />
                      View Full
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select an email to preview</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {/* Calendar Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
                <button
                  onClick={fetchCalendarEvents}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Fetch Events
                </button>
              </div>
            </div>

            {/* Event List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {events.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No calendar events loaded</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Fetch Events" to load your calendar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.summary}</h4>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {new Date(event.start.dateTime || event.start.date).toLocaleString()}
                            </p>
                            {event.location && (
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {event.location}
                              </p>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                        <button className="ml-4 text-indigo-600 hover:text-indigo-800">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'assistant' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Email Assistant
                </h3>
                <p className="text-indigo-100 text-sm mt-1">Ask me to search emails, draft responses, or schedule meetings</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg px-4 py-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 mb-1 text-indigo-600" />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask me anything about your emails..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={aiLoading || !chatMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button 
                    onClick={() => setChatMessage("Find invoices from last month")}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    "Find invoices from last month"
                  </button>
                  <button 
                    onClick={() => setChatMessage("Show my calendar events")}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    "Show my calendar events"
                  </button>
                  <button 
                    onClick={() => setChatMessage("List recent emails")}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    "List recent emails"
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add MapPin import if needed
const MapPin = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)