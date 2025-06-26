import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import toast from 'react-hot-toast'

interface EmailAccount {
  id: string
  emailAddress: string
  provider: string
  lastSynced: string | null
  createdAt: string
}

export function EmailSettings() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (token) {
      loadAccounts()
    }
  }, [token])

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const successParam = params.get('success')
    const errorParam = params.get('error')
    const email = params.get('email')

    if (successParam === 'connected' && email) {
      toast.success(`Successfully connected ${email}`)
      loadAccounts()
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (errorParam) {
      toast.error(`Failed to connect email: ${errorParam}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/my-accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to load email accounts')

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Failed to load email accounts:', err)
      toast.error('Failed to load email accounts')
    } finally {
      setLoading(false)
    }
  }

  const connectEmail = async () => {
    if (!token) return

    setConnecting(true)

    try {
      // Get OAuth URL from user-based endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/user-connect`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to get OAuth URL')

      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error('No OAuth URL received')
      }
    } catch (err) {
      console.error('Failed to initiate OAuth:', err)
      toast.error('Failed to connect email account')
      setConnecting(false)
    }
  }

  const removeAccount = async (email: string) => {
    if (!confirm(`Remove ${email}?`)) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth-user/disconnect`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to remove account')

      toast.success(`Removed ${email}`)
      loadAccounts()
    } catch (err) {
      toast.error('Failed to remove email account')
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mcp/gmail/list-emails`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ maxResults: 1 })
        }
      )

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Email connection working! Found ${data.count} emails`)
      } else {
        toast.error(data.error || 'Email connection failed')
      }
    } catch (err) {
      toast.error('Failed to test email connection')
    }
  }

  if (!token) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-yellow-800">
              Please log in to continue
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Integration Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Email Integration
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect email accounts to automatically import invoices, purchase orders, and other documents
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading email accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No email accounts connected</p>
                <p className="text-xs text-gray-500">Connect an email to start importing documents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{account.emailAddress}</p>
                        <p className="text-sm text-gray-500">
                          {account.provider} •{' '}
                          {account.lastSynced
                            ? `Last synced ${new Date(account.lastSynced).toLocaleDateString()}`
                            : 'Never synced'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={testConnection}
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => removeAccount(account.emailAddress)}
                        className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={connectEmail}
              disabled={connecting}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-4 w-4" />
              {connecting ? 'Connecting...' : 'Connect Email Account'}
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">Supported email providers:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Gmail / Google Workspace</li>
              <li>Microsoft 365 / Outlook (coming soon)</li>
              <li>IMAP (coming soon)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How it works Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            How it works
          </h3>
          <div className="mt-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Connect your company email account</li>
              <li>ERP will automatically scan for invoices, POs, and other documents</li>
              <li>AI analyzes attachments and extracts key information</li>
              <li>Documents are filed in the appropriate modules</li>
              <li>Get alerts for important deadlines and approvals</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}