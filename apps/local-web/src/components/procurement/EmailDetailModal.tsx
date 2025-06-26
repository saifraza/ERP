import { useState, useEffect } from 'react'
import { X, Mail, Paperclip, Download, FileText, Calendar, User, Eye } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface EmailDetailModalProps {
  isOpen: boolean
  onClose: () => void
  emailLog: any
  rfqNumber: string
}

export default function EmailDetailModal({ isOpen, onClose, emailLog, rfqNumber }: EmailDetailModalProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [emailContent, setEmailContent] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && emailLog?.emailId) {
      fetchEmailContent()
    }
  }, [isOpen, emailLog])

  const fetchEmailContent = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email/content/${emailLog.emailId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEmailContent(data)
        
        // Parse attachments if they exist
        if (emailLog.attachments) {
          try {
            const parsedAttachments = JSON.parse(emailLog.attachments)
            setAttachments(Array.isArray(parsedAttachments) ? parsedAttachments : [])
          } catch (e) {
            setAttachments([])
          }
        }
      } else {
        toast.error('Failed to load email content')
      }
    } catch (error) {
      console.error('Error fetching email content:', error)
      toast.error('Failed to load email content')
    } finally {
      setLoading(false)
    }
  }

  const downloadAttachment = async (attachment: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email/attachment/${emailLog.emailId}/${attachment.attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.filename || 'attachment'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to download attachment')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Failed to download attachment')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getEmailTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'rfq_sent': 'RFQ Sent',
      'vendor_response': 'Vendor Reply',
      'reminder': 'Reminder',
      'clarification': 'Clarification'
    }
    return types[type] || type
  }

  const getEmailTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'rfq_sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'vendor_response': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'reminder': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'clarification': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  if (!isOpen || !emailLog) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">RFQ {rfqNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email Metadata */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmailTypeColor(emailLog.emailType)}`}>
              {getEmailTypeLabel(emailLog.emailType)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(emailLog.sentAt || emailLog.receivedAt)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {emailLog.subject}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">From:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {emailLog.fromEmail || `${emailLog.vendor?.name} <${emailLog.toEmail}>`}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">To:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {emailLog.toEmail || emailLog.fromEmail}
                </p>
              </div>
              {emailLog.ccEmails && (
                <div className="md:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">CC:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{emailLog.ccEmails}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : emailContent ? (
            <div className="prose dark:prose-invert max-w-none">
              {emailContent.htmlBody ? (
                <div 
                  className="email-content"
                  dangerouslySetInnerHTML={{ __html: emailContent.htmlBody }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-white">
                  {emailContent.textBody || emailContent.snippet || 'No content available'}
                </pre>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              {emailLog.snippet || 'Email content not available'}
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="p-6 border-t dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments ({attachments.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {attachment.filename || `Attachment ${index + 1}`}
                      </p>
                      {attachment.size && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadAttachment(attachment)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Download attachment"
                  >
                    <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Email ID: {emailLog.emailId}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .email-content {
          font-family: inherit;
        }
        .email-content img {
          max-width: 100%;
          height: auto;
        }
        .email-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .email-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  )
}