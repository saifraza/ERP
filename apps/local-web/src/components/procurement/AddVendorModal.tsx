import { useState, useEffect } from 'react'
import { X, Building2, Mail, Phone, MapPin, CreditCard, FileText, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'

interface AddVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface VendorFormData {
  code: string
  name: string
  type: string
  gstNumber: string
  panNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  contactPerson: string
  email: string
  phone: string
  bankName: string
  bankAccount: string
  bankIFSC: string
  creditLimit: number
  creditDays: number
}

const initialFormData: VendorFormData = {
  code: '',
  name: '',
  type: 'MATERIAL',
  gstNumber: '',
  panNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  contactPerson: '',
  email: '',
  phone: '',
  bankName: '',
  bankAccount: '',
  bankIFSC: '',
  creditLimit: 0,
  creditDays: 30
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu'
]

export default function AddVendorModal({ isOpen, onClose, onSuccess }: AddVendorModalProps) {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [formData, setFormData] = useState<VendorFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<VendorFormData>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial'>('basic')
  const [generatingCode, setGeneratingCode] = useState(false)

  const generateVendorCode = async () => {
    setGeneratingCode(true)
    try {
      // Get vendor type prefix
      const typePrefix = {
        'MATERIAL': 'MAT',
        'SERVICE': 'SVC',
        'TRANSPORTER': 'TRN',
        'CONTRACTOR': 'CON',
        'OTHER': 'OTH'
      }[formData.type] || 'VEN'

      // Get next sequence number from backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendors/next-code?type=${formData.type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const nextNumber = data.nextNumber || 1
        const paddedNumber = String(nextNumber).padStart(4, '0')
        const vendorCode = `${typePrefix}${paddedNumber}`
        
        setFormData(prev => ({ ...prev, code: vendorCode }))
      } else {
        // Fallback: Generate based on timestamp
        const timestamp = Date.now().toString().slice(-4)
        const vendorCode = `${typePrefix}${timestamp}`
        setFormData(prev => ({ ...prev, code: vendorCode }))
      }
    } catch (error) {
      console.error('Error generating vendor code:', error)
      // Fallback: Generate based on timestamp
      const typePrefix = formData.type.slice(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-4)
      const vendorCode = `${typePrefix}${timestamp}`
      setFormData(prev => ({ ...prev, code: vendorCode }))
    } finally {
      setGeneratingCode(false)
    }
  }

  // Generate vendor code when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData(initialFormData)
      setErrors({})
      setActiveTab('basic')
      // Generate code after a small delay to ensure form is reset
      setTimeout(() => {
        generateVendorCode()
      }, 100)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'creditLimit' || name === 'creditDays' ? Number(value) : value
    }))
    // Clear error for this field
    if (errors[name as keyof VendorFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
    // Regenerate code if vendor type changes
    if (name === 'type') {
      generateVendorCode()
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorFormData> = {}

    // Basic validations
    if (!formData.code.trim()) newErrors.code = 'Vendor code is required'
    if (!formData.name.trim()) newErrors.name = 'Vendor name is required'
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state) newErrors.state = 'State is required'
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'

    // Format validations
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits'
    }
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits'
    }
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST format'
    }
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Vendor created successfully')
        onSuccess()
        onClose()
        setFormData(initialFormData)
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: any) => {
            toast.error(error.message)
          })
        } else {
          toast.error(data.error || 'Failed to create vendor')
        }
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
      toast.error('Failed to create vendor')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Vendor</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'contact'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Contact Details
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'financial'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Financial Information
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vendor Code * (Auto-generated)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          readOnly
                          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.code 
                              ? 'border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white cursor-not-allowed`}
                          placeholder={generatingCode ? "Generating..." : "Auto-generated"}
                        />
                        <button
                          type="button"
                          onClick={generateVendorCode}
                          disabled={generatingCode}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                          title="Regenerate code"
                        >
                          <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${generatingCode ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      {errors.code && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vendor Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.name 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., ABC Chemicals Pvt Ltd"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vendor Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="MATERIAL">Material Supplier</option>
                        <option value="SERVICE">Service Provider</option>
                        <option value="TRANSPORTER">Transporter</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.gstNumber 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        maxLength={15}
                      />
                      {errors.gstNumber && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gstNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.panNumber 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., ABCDE1234F"
                        maxLength={10}
                      />
                      {errors.panNumber && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.panNumber}</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Contact Details Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.addressLine1 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Street address, building, etc."
                    />
                    {errors.addressLine1 && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.addressLine1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.city 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., Mumbai"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State *
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.state 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        maxLength={6}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.pincode 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., 400001"
                      />
                      {errors.pincode && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pincode}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.contactPerson 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., John Doe"
                      />
                      {errors.contactPerson && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactPerson}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.email 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., vendor@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.phone 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="e.g., 9876543210"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alternate Phone
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Information Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., State Bank of India"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="bankIFSC"
                        value={formData.bankIFSC}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., SBIN0001234"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Credit Limit (₹)
                      </label>
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 500000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Credit Days
                      </label>
                      <input
                        type="number"
                        name="creditDays"
                        value={formData.creditDays}
                        onChange={handleChange}
                        min="0"
                        max="365"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Credit Information
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Credit limit and payment terms will be used for purchase orders and invoice processing. 
                          You can update these values later based on vendor performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                * Required fields
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Vendor'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}