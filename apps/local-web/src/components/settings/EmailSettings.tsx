import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCompanyStore } from '@/stores/companyStore'

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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (currentCompany) {
      loadAccounts()
    }
  }, [currentCompany])

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const successParam = params.get('success')
    const errorParam = params.get('error')
    const email = params.get('email')

    if (successParam === 'connected' && email) {
      setSuccess(`Successfully connected ${email}`)
      loadAccounts()
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (errorParam) {
      setError(`Failed to connect email: ${errorParam}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadAccounts = async () => {
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
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Failed to load email accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectEmail = async () => {
    if (!currentCompany) return

    setConnecting(true)
    setError(null)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/connect/${currentCompany.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to initiate OAuth')

      const data = await response.json()
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (err) {
      setError('Failed to connect email account')
      setConnecting(false)
    }
  }

  const removeAccount = async (email: string) => {
    if (!currentCompany || !confirm(`Remove ${email}?`)) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/accounts/${currentCompany.id}/${email}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to remove account')

      setSuccess(`Removed ${email}`)
      loadAccounts()
    } catch (err) {
      setError('Failed to remove email account')
    }
  }

  const testConnection = async (companyId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-oauth/test/${companyId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Email connection working for ${data.account}`)
      } else {
        setError(data.error || 'Email connection failed')
      }
    } catch (err) {
      setError('Failed to test email connection')
    }
  }

  if (!currentCompany) {
    return (
      <Alert>
        <AlertDescription>Please select a company first</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Integration</CardTitle>
          <CardDescription>
            Connect email accounts to automatically import invoices, purchase orders, and other documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {loading ? (
              <p>Loading email accounts...</p>
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
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{account.emailAddress}</p>
                        <p className="text-sm text-gray-500">
                          {account.provider} •{' '}
                          {account.lastSynced
                            ? `Last synced ${new Date(account.lastSynced).toLocaleDateString()}`
                            : 'Never synced'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(currentCompany.id)}
                      >
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAccount(account.emailAddress)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={connectEmail}
              disabled={connecting}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {connecting ? 'Connecting...' : 'Connect Email Account'}
            </Button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">Supported email providers:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Gmail / Google Workspace</li>
              <li>Microsoft 365 / Outlook (coming soon)</li>
              <li>IMAP (coming soon)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="list-decimal list-inside space-y-2">
            <li>Connect your company email account</li>
            <li>ERP will automatically scan for invoices, POs, and other documents</li>
            <li>AI analyzes attachments and extracts key information</li>
            <li>Documents are filed in the appropriate modules</li>
            <li>Get alerts for important deadlines and approvals</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}