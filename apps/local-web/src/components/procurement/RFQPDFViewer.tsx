import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  FileDown, 
  Mail, 
  Eye, 
  Loader2, 
  Download,
  Send,
  FileText
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from '@/lib/api-client'

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
  const { toast } = useToast()

  const downloadPDF = async () => {
    setLoading(true)
    try {
      const url = vendorId 
        ? `/api/rfqs/${rfqId}/pdf/${vendorId}`
        : `/api/rfqs/${rfqId}/pdf`
      
      const response = await apiClient.get(url, {
        responseType: 'blob'
      })
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' })
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
      
      toast({
        title: "Success",
        description: "RFQ PDF downloaded successfully",
      })
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Error",
        description: "Failed to download RFQ PDF",
        variant: "destructive",
      })
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
      
      const response = await apiClient.get(url, {
        responseType: 'blob'
      })
      
      // Create preview URL
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const previewUrl = window.URL.createObjectURL(blob)
      setPdfUrl(previewUrl)
      setPreviewOpen(true)
    } catch (error: any) {
      console.error('Error loading PDF:', error)
      toast({
        title: "Error",
        description: "Failed to load RFQ PDF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    setLoading(true)
    try {
      await apiClient.post(`/api/rfqs/${rfqId}/send`)
      
      toast({
        title: "Success",
        description: "RFQ sent to vendors successfully",
      })
      
      if (onEmailSent) {
        onEmailSent()
      }
    } catch (error: any) {
      console.error('Error sending RFQ:', error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send RFQ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={previewPDF}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="ml-2">Preview</span>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={downloadPDF}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2">Download</span>
        </Button>
        
        {!vendorId && (
          <Button
            size="sm"
            onClick={sendEmail}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Send to Vendors</span>
          </Button>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              RFQ {rfqNumber} {vendorName && `- ${vendorName}`}
            </DialogTitle>
            <DialogDescription>
              Preview of the RFQ document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-md border"
                title="RFQ Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}