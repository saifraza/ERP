import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Link, Unlink, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function EmailLinkStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    checkEmailStatus()
  }, [])

  const checkEmailStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email-oauth-user/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to check email status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email-oauth-user/connect`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          // Open OAuth URL in new window
          window.open(data.authUrl, '_blank', 'width=600,height=700')
          
          // Poll for completion
          const checkInterval = setInterval(async () => {
            await checkEmailStatus()
            if (status?.hasCredentials) {
              clearInterval(checkInterval)
              setConnecting(false)
            }
          }, 2000)
          
          // Stop checking after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval)
            setConnecting(false)
          }, 300000)
        }
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your email? You will need to reconnect to use email features.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email-oauth-user/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        await checkEmailStatus()
      }
    } catch (error) {
      console.error('Failed to disconnect email:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Checking email status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Email Integration</span>
            </div>
            {status?.hasCredentials ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <Unlink className="h-4 w-4" />
                Disconnect
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="gap-2"
              >
                <Link className="h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect Gmail'}
              </Button>
            )}
          </div>

          {status?.hasCredentials ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Connected to <strong>{status.emailAddress}</strong>
                {status.lastSynced && (
                  <span className="text-muted-foreground">
                    {' '}• Last synced: {new Date(status.lastSynced).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : status?.needsOAuth ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your profile shows <strong>{user?.linkedGmailEmail}</strong> as your work email, 
                but you need to authorize access. Click "Connect Gmail" to complete the setup.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No email account linked. Connect your Gmail account to use email features.
              </AlertDescription>
            </Alert>
          )}

          {connecting && (
            <Alert>
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <AlertDescription>
                  Complete the authorization in the popup window...
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}