import { useState, useEffect } from 'react'
import { 
  X, 
  Mail, 
  Eye, 
  Loader2, 
  Download,
  Send,
  FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import RFQEmailPreview from './RFQEmailPreview'

interface RFQPDFViewerProps {
  rfqId: string
  rfqNumber: string
  vendorId?: string
  vendorName?: string
  onEmailSent?: () => void
  rfqData?: any // Pass RFQ data from parent to avoid refetch
}

export function RFQPDFViewer({ 
  rfqId, 
  rfqNumber, 
  vendorId, 
  vendorName,
  onEmailSent,
  rfqData: parentRfqData 
}: RFQPDFViewerProps) {
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [rfqData, setRfqData] = useState<any>(null)
  const { token } = useAuthStore()

  const downloadPDF = async () => {
    setLoading(true)
    try {
      const url = vendorId 
        ? `/api/rfqs/${rfqId}/pdf/${vendorId}`
        : `/api/rfqs/${rfqId}/pdf`
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Failed to download PDF')
      
      // Check content type for proper file extension
      const contentType = response.headers.get('content-type')
      const isHtml = contentType?.includes('text/html')
      
      // Create download link
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = vendorId 
        ? `RFQ_${rfqNumber}_${vendorName?.replace(/\s+/g, '_')}.${isHtml ? 'html' : 'pdf'}`
        : `RFQ_${rfqNumber}.${isHtml ? 'html' : 'pdf'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success("RFQ PDF downloaded successfully")
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast.error("Failed to download RFQ PDF")
    } finally {
      setLoading(false)
    }
  }

  const previewPDF = async () => {
    setLoading(true)
    try {
      const url = vendorId 
        ? `/api/rfqs/${rfqId}/pdf/${vendorId}`
        : `/api/rfqs/${rfqId}/pdf`
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Failed to load PDF')
      
      // Check content type
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('text/html')) {
        // For HTML content, open in new window
        const blob = await response.blob()
        const htmlUrl = window.URL.createObjectURL(blob)
        const newWindow = window.open(htmlUrl, '_blank', 'width=800,height=600')
        
        // Clean up after window is opened
        setTimeout(() => {
          window.URL.revokeObjectURL(htmlUrl)
        }, 1000)
        
        if (!newWindow) {
          toast.error('Please allow popups to view the RFQ')
        }
      } else {
        // For PDF content
        const blob = await response.blob()
        const previewUrl = window.URL.createObjectURL(blob)
        setPdfUrl(previewUrl)
        setPreviewOpen(true)
      }
    } catch (error: any) {
      console.error('Error loading PDF:', error)
      toast.error("Failed to load RFQ PDF")
    } finally {
      setLoading(false)
    }
  }

  // Fetch RFQ data for email preview
  const fetchRFQData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('RFQ fetch error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch RFQ data')
      }
      
      const data = await response.json()
      console.log('RFQ data received:', data)
      
      // Handle both response formats
      const rfqData = data.rfq || data
      if (!rfqData || !rfqData.vendors) {
        throw new Error('Invalid RFQ data format')
      }
      
      setRfqData(rfqData)
    } catch (error: any) {
      console.error('Error fetching RFQ data:', error)
      toast.error(error.message || 'Failed to load RFQ data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendEmail = async () => {
    if (parentRfqData) {
      setRfqData(parentRfqData)
      setShowEmailPreview(true)
    } else {
      // Fetch data first
      setLoading(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('RFQ fetch error:', errorData)
          throw new Error(errorData.error || 'Failed to fetch RFQ data')
        }
        
        const data = await response.json()
        console.log('RFQ data received:', data)
        
        // Handle both response formats
        const fetchedRfqData = data.rfq || data
        if (!fetchedRfqData || !fetchedRfqData.vendors) {
          throw new Error('Invalid RFQ data format')
        }
        
        setRfqData(fetchedRfqData)
        setShowEmailPreview(true)
      } catch (error: any) {
        console.error('Error fetching RFQ data:', error)
        toast.error(error.message || 'Failed to load RFQ data')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={previewPDF}
          disabled={loading}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Preview
        </button>
        
        <button
          onClick={downloadPDF}
          disabled={loading}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download
        </button>
        
        {!vendorId && (
          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send to Vendors
          </button>
        )}
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setPreviewOpen(false)
              if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl)
                setPdfUrl(null)
              }
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-6xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  RFQ {rfqNumber} {vendorName && `- ${vendorName}`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setPreviewOpen(false)
                  if (pdfUrl) {
                    window.URL.revokeObjectURL(pdfUrl)
                    setPdfUrl(null)
                  }
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="h-[calc(100%-4rem)]">
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-md border border-gray-200 dark:border-gray-700"
                  title="RFQ Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Email Preview Modal */}
      {showEmailPreview && rfqData && (
        <RFQEmailPreview
          rfqId={rfqId}
          rfqNumber={rfqNumber}
          vendors={rfqData.vendors?.map((v: any) => ({
            id: v.vendor?.id || v.id,
            name: v.vendor?.name || v.name,
            email: v.vendor?.email || v.email,
            code: v.vendor?.code || v.code,
            contactPerson: v.vendor?.contactPerson || v.contactPerson
          })) || []}
          onClose={() => setShowEmailPreview(false)}
          onEmailSent={() => {
            setShowEmailPreview(false)
            if (onEmailSent) onEmailSent()
          }}
        />
      )}
    </>
  )
}