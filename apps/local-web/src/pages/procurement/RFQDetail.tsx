import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, FileText, Calendar, Package, Building, 
  Mail, Download, Eye, Send, Clock, CheckCircle, 
  XCircle, AlertCircle, Users
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import { RFQPDFViewer } from '../../components/procurement/RFQPDFViewer'

interface RFQDetail {
  id: string
  rfqNumber: string
  status: string
  issueDate: string
  submissionDeadline: string
  expectedDeliveryDate: string
  deliveryTerms: string
  paymentTerms: string
  specialInstructions?: string
  quotationValidityDays: number
  requisition: {
    requisitionNo: string
    division?: { name: string }
    department?: string
  }
  vendors: Array<{
    id: string
    vendor: {
      id: string
      name: string
      email: string
      code: string
    }
    emailSent: boolean
    responseReceived: boolean
  }>
  items: Array<{
    id: string
    material: {
      code: string
      name: string
      description?: string
      uom: { code: string }
    }
    quantity: number
    requiredDate: string
    specifications?: string
  }>
  quotations: Array<{
    id: string
    quotationNumber: string
    vendor: { name: string }
    totalAmount: number
    status: string
  }>
}

export default function RFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<RFQDetail | null>(null)

  useEffect(() => {
    fetchRFQDetail()
  }, [id])

  const fetchRFQDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        toast.error('Failed to load RFQ details')
        navigate('/procurement/rfqs')
        return
      }

      const data = await response.json()
      setRfq(data.rfq)
    } catch (error) {
      console.error('Error fetching RFQ:', error)
      toast.error('Failed to load RFQ details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'SENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">RFQ not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{rfq.rfqNumber}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                {rfq.status}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Created on {new Date(rfq.issueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/procurement/rfqs/${id}/email-history`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Mail className="h-4 w-4" />
            Email History
          </button>
          {rfq.quotations && rfq.quotations.length > 0 && (
            <button
              onClick={() => navigate(`/procurement/rfqs/${id}/comparison`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FileText className="h-4 w-4" />
              Compare Quotations ({rfq.quotations.length})
            </button>
          )}
          <RFQPDFViewer 
            rfqId={rfq.id} 
            rfqNumber={rfq.rfqNumber}
            onEmailSent={fetchRFQDetail}
            rfqData={rfq}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* RFQ Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">RFQ Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">PR Reference</p>
                <p className="font-medium text-gray-900 dark:text-white">{rfq.requisition.requisitionNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Division</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {rfq.requisition.division?.name || rfq.requisition.department || 'General'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submission Deadline</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(rfq.submissionDeadline).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(rfq.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Terms</p>
                <p className="font-medium text-gray-900 dark:text-white">{rfq.deliveryTerms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Terms</p>
                <p className="font-medium text-gray-900 dark:text-white">{rfq.paymentTerms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Validity</p>
                <p className="font-medium text-gray-900 dark:text-white">{rfq.quotationValidityDays} days</p>
              </div>
              {rfq.specialInstructions && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Special Instructions</p>
                  <p className="font-medium text-gray-900 dark:text-white">{rfq.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items ({rfq.items.length})
            </h3>
            <div className="space-y-3">
              {rfq.items.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.material.code} - {item.material.name}
                        </span>
                      </div>
                      {item.material.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                          {item.material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 ml-6 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Qty: <span className="font-medium text-gray-900 dark:text-white">
                            {item.quantity} {item.material.uom.code}
                          </span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Required by: <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(item.requiredDate).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      {item.specifications && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-6 mt-1">
                          Specs: {item.specifications}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vendors */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vendors ({rfq.vendors.length})
            </h3>
            <div className="space-y-3">
              {rfq.vendors.map((vendorRfq) => (
                <div key={vendorRfq.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {vendorRfq.vendor.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {vendorRfq.vendor.code} • {vendorRfq.vendor.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendorRfq.emailSent && (
                      <span title="Email sent">
                        <Mail className="h-4 w-4 text-green-600" />
                      </span>
                    )}
                    {vendorRfq.responseReceived && (
                      <span title="Response received">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Individual vendor PDFs */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Download vendor-specific RFQs:</p>
              {rfq.vendors.map((vendorRfq) => (
                <div key={vendorRfq.id}>
                  <RFQPDFViewer 
                    rfqId={rfq.id} 
                    rfqNumber={rfq.rfqNumber}
                    vendorId={vendorRfq.vendor.id}
                    vendorName={vendorRfq.vendor.name}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quotations */}
          {rfq.quotations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quotations ({rfq.quotations.length})
              </h3>
              <div className="space-y-3">
                {rfq.quotations.map((quotation) => (
                  <div key={quotation.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {quotation.quotationNumber}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {quotation.vendor.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₹{quotation.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {quotation.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/procurement/rfqs/${id}/comparison`)}
                className="w-full mt-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Compare Quotations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}