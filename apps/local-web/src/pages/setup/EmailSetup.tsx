import { useState, useEffect } from 'react'
import { Mail, AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface EmailSetupProps {
  onNext: () => void
  isFirstStep?: boolean
}

export default function EmailSetup({ onNext, isFirstStep = true }: EmailSetupProps) {
  const { token, user } = useAuthStore()
  const [linkedEmail, setLinkedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasLinkedEmail, setHasLinkedEmail] = useState(false)

  useEffect(() => {
    checkExistingEmail()
  }, [])

  const checkExistingEmail = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user?.linkedGmailEmail) {
          setLinkedEmail(data.user.linkedGmailEmail)
          setHasLinkedEmail(true)
        }
      }
    } catch (error) {
      console.error('Error checking linked email:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleLinkEmail = async () => {
    if (!linkedEmail || !linkedEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      // TODO: Implement OAuth flow for Gmail
      // For now, we'll just update the email
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/link-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: linkedEmail }),
      })

      if (response.ok) {
        toast.success('Email linked successfully!')
        setHasLinkedEmail(true)
        setTimeout(onNext, 1000)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to link email')
      }
    } catch (error) {
      console.error('Error linking email:', error)
      toast.error('Failed to link email')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Link Your Work Email</h2>
        <p className="mt-2 text-gray-600">
          Link your Gmail account to send and receive emails directly from the ERP system
        </p>
      </div>

      {hasLinkedEmail ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Email Already Linked</p>
              <p className="text-sm text-green-700 mt-1">
                Your work email <span className="font-semibold">{linkedEmail}</span> is already linked
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onNext} className="btn-primary">
              Continue Setup
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Important Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You must use your official work email address</li>
                    <li>The email must be a Gmail account (@gmail.com or Google Workspace)</li>
                    <li>Each user must have their own unique email account</li>
                    <li>This email will be used for all procurement communications</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Email Address *
              </label>
              <input
                type="email"
                value={linkedEmail}
                onChange={(e) => setLinkedEmail(e.target.value)}
                placeholder="your.name@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This should be your official work Gmail or Google Workspace email
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Next Steps:</p>
                  <p>After entering your email, you'll need to:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Authorize the ERP to access your Gmail</li>
                    <li>Grant permissions to send/receive emails</li>
                    <li>Complete the OAuth authentication</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => window.open('https://myaccount.google.com/permissions', '_blank')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Manage Google Permissions
                <ExternalLink className="h-3 w-3" />
              </button>
              
              <button
                onClick={handleLinkEmail}
                disabled={loading || !linkedEmail}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    Link Email & Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}