import { useState, useEffect } from 'react'
import { 
  X, Send, Paperclip, ChevronDown, ChevronUp, 
  Mail, FileText, Check, AlertCircle 
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'

interface Vendor {
  id: string
  name: string
  email: string
  code: string
  contactPerson?: string
}

interface RFQEmailPreviewProps {
  rfqId: string
  rfqNumber: string
  vendors: Vendor[]
  onClose: () => void
  onEmailSent: () => void
  isReminder?: boolean
}

export default function RFQEmailPreview({ 
  rfqId, 
  rfqNumber, 
  vendors, 
  onClose, 
  onEmailSent,
  isReminder = false
}: RFQEmailPreviewProps) {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [selectedVendors, setSelectedVendors] = useState<string[]>(vendors.map(v => v.id))
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [ccEmails, setCcEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sentVendors, setSentVendors] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Generate default email content
    const subject = isReminder 
      ? `Reminder: Request for Quotation - ${rfqNumber} - ${currentCompany?.name || 'Our Company'}`
      : `Request for Quotation - ${rfqNumber} - ${currentCompany?.name || 'Our Company'}`
    setEmailSubject(subject)
    
    const body = generateEmailBody()
    setEmailBody(body)
  }, [rfqNumber, currentCompany])

  const generateEmailBody = () => {
    const companyName = currentCompany?.name || 'Our Company'
    const companyEmail = currentCompany?.email || 'procurement@company.com'
    const companyPhone = currentCompany?.phone || ''
    
    return `Dear {vendorName},

Greetings from ${companyName}!

We are pleased to invite you to submit your competitive quotation for our requirement as per the attached Request for Quotation (RFQ) document.

RFQ Details:
- RFQ Number: ${rfqNumber}
- Issue Date: ${new Date().toLocaleDateString('en-IN')}
- Due Date: {dueDate}
- Division: {division}

Please find attached the detailed RFQ document which contains:
• Complete item specifications and quantities
• Commercial terms and conditions
• Technical requirements
• Submission guidelines
• Evaluation criteria

Important Instructions:
1. Please submit your quotation on or before {dueDate}
2. Quote your best prices in INR inclusive of all taxes (show GST separately)
3. Mention delivery period for each item
4. Quotation should be valid for minimum 90 days
5. Send your quotation via email reply with "Quotation for RFQ ${rfqNumber}" in subject line

For any clarifications, please feel free to contact us.

We look forward to receiving your competitive quotation and establishing a long-term business relationship.

Best regards,

Procurement Team
${companyName}
Email: ${companyEmail}
${companyPhone ? `Phone: ${companyPhone}` : ''}

---
This is an automated email. Please do not reply to this email address.`
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSendEmails = async () => {
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }

    setSending(true)
    setErrors({})
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      // Send RFQ to selected vendors - use resend endpoint for reminders
      const endpoint = isReminder ? `/api/rfqs/${rfqId}/resend` : `/api/rfqs/${rfqId}/send`
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorIds: selectedVendors,
          customSubject: emailSubject,
          customBody: emailBody,
          ccEmails: ccEmails ? ccEmails.split(',').map(e => e.trim()) : []
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send emails')
      }

      const result = await response.json()
      
      // Mark successful sends
      const successfulVendors = result.results
        ?.filter((r: any) => r.success)
        ?.map((r: any) => r.vendorId) || []
      
      setSentVendors(successfulVendors)
      
      // Show errors for failed sends
      const failedVendors = result.results?.filter((r: any) => !r.success) || []
      const newErrors: Record<string, string> = {}
      failedVendors.forEach((f: any) => {
        newErrors[f.vendorId] = f.error || 'Failed to send'
      })
      setErrors(newErrors)
      
      if (successfulVendors.length > 0) {
        toast.success(`RFQ sent to ${successfulVendors.length} vendor(s)`)
        setTimeout(() => {
          onEmailSent()
          onClose()
        }, 2000)
      } else {
        toast.error('Failed to send emails to any vendor')
      }
    } catch (error: any) {
      console.error('Error sending emails:', error)
      toast.error(error.message || 'Failed to send emails')
    } finally {
      setSending(false)
    }
  }

  const getVendorEmailPreview = (vendor: Vendor) => {
    return emailBody
      .replace(/{vendorName}/g, vendor.contactPerson || vendor.name)
      .replace(/{dueDate}/g, 'submission deadline')
      .replace(/{division}/g, 'requested division')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Gmail-like Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Send RFQ to Vendors
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Recipients Section */}
          <div className="p-6 space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To: Select Vendors
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {vendors.map(vendor => (
                  <label 
                    key={vendor.id}
                    className={`flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer ${
                      sentVendors.includes(vendor.id) ? 'bg-green-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => handleVendorToggle(vendor.id)}
                      disabled={sentVendors.includes(vendor.id)}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {vendor.name} ({vendor.code})
                        </span>
                        <div className="text-sm text-gray-600">
                          {vendor.email ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              No email address
                            </span>
                          )}
                          {vendor.contactPerson && (
                            <span className="ml-4">• {vendor.contactPerson}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {sentVendors.includes(vendor.id) && (
                      <Check className="h-4 w-4 text-green-600 ml-2" />
                    )}
                    {errors[vendor.id] && (
                      <div className="ml-2 text-red-600 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[vendor.id]}
                      </div>
                    )}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {selectedVendors.length} vendor(s) selected
                {selectedVendors.length > 0 && (
                  <span className="ml-2">
                    • {vendors.filter(v => selectedVendors.includes(v.id) && v.email).length} with valid email(s)
                  </span>
                )}
              </p>
            </div>

            {/* CC Field */}
            <div>
              <button
                onClick={() => setShowCc(!showCc)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                {showCc ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                Add CC
              </button>
              {showCc && (
                <input
                  type="text"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="Enter CC emails separated by commas"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Attachments Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <FileText className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-700">
                  RFQ_{rfqNumber}.pdf
                </span>
                <span className="text-xs text-gray-500">
                  (Will be generated and attached for each vendor)
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Content
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Variables: {'{vendorName}'}, {'{dueDate}'}, {'{division}'} will be replaced with actual values
              </p>
            </div>

            {/* Preview for first vendor */}
            {selectedVendors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview (for {vendors.find(v => v.id === selectedVendors[0])?.name})
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {getVendorEmailPreview(vendors.find(v => v.id === selectedVendors[0])!)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Each vendor will receive a personalized email with their specific RFQ PDF
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmails}
              disabled={sending || selectedVendors.length === 0}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send RFQ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}