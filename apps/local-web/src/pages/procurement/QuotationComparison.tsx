import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, 
  TrendingUp, TrendingDown, Award, Package
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface ItemComparison {
  itemCode: string
  itemDescription: string
  quantity: number
  unit: string
  vendors: Array<{
    vendorId: string
    vendorName: string
    vendorRating: number
    unitPrice: number
    totalAmount: number
    deliveryDays?: number
    warranty?: string
  }>
}

interface OverallComparison {
  vendorId: string
  vendorName: string
  vendorRating: number
  quotationNumber: string
  totalAmount: number
  paymentTerms?: string
  deliveryTerms?: string
  validUntil: string
}

export default function QuotationComparison() {
  const { id } = useParams() // RFQ ID
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [itemComparison, setItemComparison] = useState<ItemComparison[]>([])
  const [overallComparison, setOverallComparison] = useState<OverallComparison[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComparison()
  }, [id])

  const fetchComparison = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/rfqs/${id}/comparison`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch comparison')

      const data = await response.json()
      setRfq(data.rfq)
      setItemComparison(data.itemComparison)
      setOverallComparison(data.overallComparison)
      
      // Auto-select lowest price vendors
      const autoSelected: Record<string, string> = {}
      data.itemComparison.forEach((item: ItemComparison) => {
        if (item.vendors.length > 0) {
          autoSelected[item.itemCode] = item.vendors[0].vendorId // First vendor is lowest price
        }
      })
      setSelectedItems(autoSelected)
    } catch (error) {
      console.error('Error fetching comparison:', error)
      toast.error('Failed to load quotation comparison')
    } finally {
      setLoading(false)
    }
  }

  const handleVendorSelection = (itemCode: string, vendorId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemCode]: vendorId
    }))
  }

  const handleSubmitSelection = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Please select vendors for items')
      return
    }

    setSubmitting(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const selections = Object.entries(selectedItems).map(([itemCode, vendorId]) => ({
        itemCode,
        vendorId,
        reason: 'Best price' // Can be enhanced to allow custom reasons
      }))

      const response = await fetch(`${apiUrl}/api/rfqs/${id}/select-vendors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selections })
      })

      if (!response.ok) throw new Error('Failed to submit selection')

      toast.success('Vendor selection saved successfully')
      navigate(`/procurement/rfqs/${id}`)
    } catch (error) {
      console.error('Error submitting selection:', error)
      toast.error('Failed to save vendor selection')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!rfq || itemComparison.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No quotations available for comparison</p>
        </div>
      </div>
    )
  }

  const calculateTotalForSelection = () => {
    return Object.entries(selectedItems).reduce((total, [itemCode, vendorId]) => {
      const item = itemComparison.find(i => i.itemCode === itemCode)
      const vendor = item?.vendors.find(v => v.vendorId === vendorId)
      return total + (vendor?.totalAmount || 0)
    }, 0)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/procurement/rfqs/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQ
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Comparison</h1>
            <p className="text-sm text-gray-600 mt-1">
              RFQ #{rfq.rfqNumber} - {overallComparison.length} quotations received
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Selected Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{calculateTotalForSelection().toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleSubmitSelection}
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Selection
            </button>
          </div>
        </div>
      </div>

      {/* Overall Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overallComparison.map((vendor, index) => (
                  <tr key={vendor.vendorId} className={index === 0 ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">Rating: {vendor.vendorRating}/5</div>
                        </div>
                        {index === 0 && (
                          <Award className="h-4 w-4 text-green-600 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.quotationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ₹{vendor.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.paymentTerms || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.deliveryTerms || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vendor.validUntil).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item-wise Comparison */}
      <div className="space-y-6">
        {itemComparison.map((item) => (
          <div key={item.itemCode} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.itemCode}</h3>
                  <p className="text-sm text-gray-600">{item.itemDescription}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Quantity: {item.quantity} {item.unit}
                  </p>
                </div>
                <Package className="h-6 w-6 text-gray-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warranty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {item.vendors.map((vendor, index) => (
                      <tr 
                        key={vendor.vendorId} 
                        className={`${selectedItems[item.itemCode] === vendor.vendorId ? 'bg-blue-50' : ''} ${index === 0 ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="radio"
                            name={`item-${item.itemCode}`}
                            checked={selectedItems[item.itemCode] === vendor.vendorId}
                            onChange={() => handleVendorSelection(item.itemCode, vendor.vendorId)}
                            className="h-4 w-4 text-primary-600"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">Rating: {vendor.vendorRating}/5</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₹{vendor.unitPrice.toLocaleString()}
                          {index === 0 && <TrendingDown className="h-3 w-3 text-green-600 inline ml-1" />}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ₹{vendor.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {vendor.deliveryDays || 'N/A'} days
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {vendor.warranty || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selection Summary</h3>
        <div className="space-y-2">
          {Object.entries(selectedItems).map(([itemCode, vendorId]) => {
            const item = itemComparison.find(i => i.itemCode === itemCode)
            const vendor = item?.vendors.find(v => v.vendorId === vendorId)
            return (
              <div key={itemCode} className="flex justify-between text-sm">
                <span className="text-gray-600">{itemCode} - {vendor?.vendorName}</span>
                <span className="font-medium">₹{vendor?.totalAmount.toLocaleString()}</span>
              </div>
            )
          })}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>₹{calculateTotalForSelection().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}