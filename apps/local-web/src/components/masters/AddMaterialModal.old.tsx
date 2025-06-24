import { useState, useEffect } from 'react'
import { X, Package, AlertCircle, Info, Shield, Archive, Beaker, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface AddMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface MaterialFormData {
  name: string
  description: string
  category: string
  subCategory: string
  industryCategory: string
  division: string
  unit: string
  hsnCode: string
  technicalGrade: string
  complianceStandard: string
  specifications: string
  criticalItem: boolean
  shelfLife: number
  storageConditions: string
  hazardCategory: string
  reorderLevel: number
  reorderQuantity: number
  minOrderQuantity: number
  maxOrderQuantity: number
  leadTimeDays: number
  preferredVendors: string[]
  qualityParameters: Record<string, any>
}

const initialFormData: MaterialFormData = {
  name: '',
  description: '',
  category: 'raw_material',
  subCategory: '',
  industryCategory: '',
  division: 'common',
  unit: '',
  hsnCode: '',
  technicalGrade: '',
  complianceStandard: '',
  specifications: '',
  criticalItem: false,
  shelfLife: 0,
  storageConditions: '',
  hazardCategory: 'Non-Hazardous',
  reorderLevel: 0,
  reorderQuantity: 0,
  minOrderQuantity: 0,
  maxOrderQuantity: 0,
  leadTimeDays: 0,
  preferredVendors: [],
  qualityParameters: {}
}

const units = ['KG', 'LTR', 'PCS', 'MTR', 'TON', 'BOX', 'BAG', 'ROLL', 'SET', 'PAIR', 'DOZEN']

export default function AddMaterialModal({ isOpen, onClose, onSuccess }: AddMaterialModalProps) {
  const { token } = useAuthStore()
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof MaterialFormData, string>>>({})
  const [industryCategories, setIndustryCategories] = useState<{value: string, label: string}[]>([])
  const [vendors, setVendors] = useState<{id: string, code: string, name: string}[]>([])
  const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'inventory'>('basic')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
      setErrors({})
      setActiveTab('basic')
      fetchVendors()
    }
  }, [isOpen])

  // Fetch industry categories when division or category changes
  useEffect(() => {
    if (formData.division && formData.category) {
      fetchIndustryCategories()
    }
  }, [formData.division, formData.category])

  const fetchIndustryCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/industry-categories?division=${formData.division}&category=${formData.category}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setIndustryCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching industry categories:', error)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendors?isActive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? checked
        : ['reorderLevel', 'reorderQuantity', 'minOrderQuantity', 'maxOrderQuantity', 'leadTimeDays', 'shelfLife'].includes(name) 
        ? Number(value) 
        : value
    }))
    // Clear error for this field
    if (errors[name as keyof MaterialFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleVendorChange = (vendorIds: string[]) => {
    setFormData(prev => ({ ...prev, preferredVendors: vendorIds }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MaterialFormData, string>> = {}

    if (!formData.name.trim()) newErrors.name = 'Material name is required'
    if (!formData.unit.trim()) newErrors.unit = 'Unit is required'
    if (!formData.division) newErrors.division = 'Division is required'
    
    // Validate quantities
    if (formData.reorderLevel < 0) newErrors.reorderLevel = 'Reorder level cannot be negative'
    if (formData.reorderQuantity < 0) newErrors.reorderQuantity = 'Reorder quantity cannot be negative'
    if (formData.minOrderQuantity < 0) newErrors.minOrderQuantity = 'Min order quantity cannot be negative'
    if (formData.leadTimeDays < 0) newErrors.leadTimeDays = 'Lead time cannot be negative'

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Material created with code: ${data.material.code}`)
        onSuccess()
        onClose()
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: any) => {
            toast.error(error.message)
          })
        } else {
          toast.error(data.error || 'Failed to create material')
        }
      }
    } catch (error) {
      console.error('Error creating material:', error)
      toast.error('Failed to create material')
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
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Material</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Code will be auto-generated</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Material Name *
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
                      placeholder="e.g., Mild Steel Pipe 2 inch"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="raw_material">Raw Material</option>
                      <option value="consumable">Consumable</option>
                      <option value="spare_part">Spare Part</option>
                      <option value="chemical">Chemical</option>
                      <option value="packing">Packing Material</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sub Category
                    </label>
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Piping, Electrical, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Division *
                    </label>
                    <select
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.division 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">Select Division</option>
                      <option value="sugar">Sugar</option>
                      <option value="ethanol">Ethanol</option>
                      <option value="power">Power</option>
                      <option value="feed">Animal Feed</option>
                      <option value="common">Common (Shared)</option>
                    </select>
                    {errors.division && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.division}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit of Measurement *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.unit 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    {errors.unit && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      name="hsnCode"
                      value={formData.hsnCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., 7304"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Detailed description of the material..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Technical Specifications
                    </label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Size, grade, quality parameters, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inventory Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reorder Quantity
                    </label>
                    <input
                      type="number"
                      name="reorderQuantity"
                      value={formData.reorderQuantity}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Order Quantity
                    </label>
                    <input
                      type="number"
                      name="minOrderQuantity"
                      value={formData.minOrderQuantity}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      name="leadTimeDays"
                      value={formData.leadTimeDays}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Material Code
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      A unique material code will be automatically generated based on the category you select. 
                      The format will be: [Category Prefix]-[Sequential Number]
                    </p>
                  </div>
                </div>
              </div>
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
                    'Create Material'
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