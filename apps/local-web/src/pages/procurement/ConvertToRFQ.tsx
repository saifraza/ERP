import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, ArrowRight, Calendar, Package, User, 
  Building, AlertCircle, Calculator, Plus, Trash2,
  FileText, Search
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface RequisitionItem {
  id: string
  material: {
    id: string
    code: string
    name: string
    description?: string
    uom?: { code: string }
  }
  quantity: number
  requiredDate: string
  specification?: string
  remarks?: string
}

interface Requisition {
  id: string
  requisitionNo: string
  requisitionDate: string
  factory: { name: string; code: string }
  division?: { name: string; code: string }
  department: string
  priority: string
  purpose?: string
  status: string
  requestedBy: string
  items: RequisitionItem[]
}

interface Vendor {
  id: string
  code: string
  name: string
  email: string
  category: string
  rating?: number
}

export default function ConvertToRFQ() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [requisition, setRequisition] = useState<Requisition | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [searchVendor, setSearchVendor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [rfqData, setRfqData] = useState({
    rfqDate: new Date().toISOString().split('T')[0],
    submissionDeadline: '',
    deliveryDate: '',
    deliveryTerms: 'Door Delivery',
    paymentTerms: '30 Days',
    specialInstructions: '',
    validityDays: 30
  })

  useEffect(() => {
    fetchRequisitionAndVendors()
  }, [id])

  const fetchRequisitionAndVendors = async () => {
    try {
      setLoading(true)
      
      // Fetch requisition details
      const prResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requisitions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!prResponse.ok) {
        toast.error('Failed to load requisition')
        navigate('/procurement/requisitions')
        return
      }

      const response = await prResponse.json()
      const prData = response.requisition || response
      
      console.log('Requisition data:', prData) // Debug log
      
      // Check if PR is approved
      if (prData.status !== 'APPROVED') {
        toast.error(`Only approved requisitions can be converted to RFQ. Current status: ${prData.status}`)
        navigate('/procurement/requisitions')
        return
      }
      
      setRequisition(prData)

      // Fetch vendors
      const vendorResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendors?isActive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json()
        setVendors(vendorData.vendors || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSubmit = async () => {
    // Validation
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }

    if (!rfqData.submissionDeadline) {
      toast.error('Please set submission deadline')
      return
    }

    if (!rfqData.deliveryDate) {
      toast.error('Please set expected delivery date')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rfqs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requisitionId: id,
            ...rfqData,
            vendorIds: selectedVendors,
            items: requisition?.items.map(item => ({
              materialId: item.material.id,
              quantity: item.quantity,
              requiredDate: item.requiredDate,
              specification: item.specification
            }))
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'RFQ created successfully')
        navigate(`/procurement/rfqs/${data.rfq.id}`)
      } else {
        const error = await response.json()
        console.error('RFQ creation error:', error)
        toast.error(error.error || 'Failed to create RFQ')
      }
    } catch (error) {
      console.error('Error creating RFQ:', error)
      toast.error('Failed to create RFQ')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchVendor.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchVendor.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchVendor.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!requisition) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Requisition not found</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Convert to RFQ</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create RFQ from {requisition.requisitionNo}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - RFQ Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* PR Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requisition Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">PR Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{requisition.requisitionNo}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(requisition.requisitionDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Department</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {requisition.division?.name || requisition.department}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Priority</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{requisition.priority}</p>
              </div>
            </div>
          </div>

          {/* RFQ Details Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">RFQ Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RFQ Date
                </label>
                <input
                  type="date"
                  value={rfqData.rfqDate}
                  onChange={(e) => setRfqData({ ...rfqData, rfqDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Submission Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={rfqData.submissionDeadline}
                  onChange={(e) => setRfqData({ ...rfqData, submissionDeadline: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rfqData.deliveryDate}
                  onChange={(e) => setRfqData({ ...rfqData, deliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  value={rfqData.validityDays}
                  onChange={(e) => setRfqData({ ...rfqData, validityDays: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Terms
                </label>
                <select
                  value={rfqData.deliveryTerms}
                  onChange={(e) => setRfqData({ ...rfqData, deliveryTerms: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Door Delivery">Door Delivery</option>
                  <option value="Ex-Works">Ex-Works</option>
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Terms
                </label>
                <select
                  value={rfqData.paymentTerms}
                  onChange={(e) => setRfqData({ ...rfqData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Advance">100% Advance</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="45 Days">45 Days</option>
                  <option value="60 Days">60 Days</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={rfqData.specialInstructions}
                  onChange={(e) => setRfqData({ ...rfqData, specialInstructions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any special instructions for vendors..."
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items ({requisition.items.length})
            </h3>
            <div className="space-y-3">
              {requisition.items.map((item, index) => (
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
                            {item.quantity} {item.material.uom?.code || 'NOS'}
                          </span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Required by: <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(item.requiredDate).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Vendor Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Vendors ({selectedVendors.length})
            </h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchVendor}
                onChange={(e) => setSearchVendor(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Vendor List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredVendors.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No vendors found
                </p>
              ) : (
                filteredVendors.map(vendor => (
                  <label
                    key={vendor.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => handleVendorToggle(vendor.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {vendor.code} • {vendor.category}
                      </p>
                    </div>
                    {vendor.rating && (
                      <span className="text-xs font-medium text-yellow-600">
                        ★ {vendor.rating.toFixed(1)}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedVendors.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Create RFQ
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}