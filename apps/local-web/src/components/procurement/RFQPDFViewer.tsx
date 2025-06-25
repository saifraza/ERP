import { useState } from 'react'
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

interface RFQPDFViewerProps {
  rfqId: string
  rfqNumber: string
  vendorId?: string
  vendorName?: string
  onEmailSent?: () => void
}

export function RFQPDFViewer({ 
  rfqId, 
  rfqNumber, 
  vendorId, 
  vendorName,
  onEmailSent 
}: RFQPDFViewerProps) {
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
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
      
      // Create download link
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = vendorId 
        ? `RFQ_${rfqNumber}_${vendorName?.replace(/\s+/g, '_')}.pdf`
        : `RFQ_${rfqNumber}.pdf`
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
      
      // Create preview URL
      const blob = await response.blob()
      const previewUrl = window.URL.createObjectURL(blob)
      setPdfUrl(previewUrl)
      setPreviewOpen(true)
    } catch (error: any) {
      console.error('Error loading PDF:', error)
      toast.error("Failed to load RFQ PDF")
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rfqs/${rfqId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send RFQ')
      }
      
      toast.success("RFQ sent to vendors successfully")
      
      if (onEmailSent) {
        onEmailSent()
      }
    } catch (error: any) {
      console.error('Error sending RFQ:', error)
      toast.error(error.message || "Failed to send RFQ")
    } finally {
      setLoading(false)
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
            onClick={sendEmail}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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
    </>
  )
}