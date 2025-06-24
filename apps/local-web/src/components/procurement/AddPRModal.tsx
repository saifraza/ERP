import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Package, Building, Calendar, AlertCircle, Search } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface AddPRModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PRItem {
  itemCode: string
  itemDescription: string
  quantity: number
  unit: string
  estimatedPrice?: number
  specifications?: string
  preferredVendor?: string
  justification?: string
}

interface Division {
  id: string
  name: string
  code: string
}

interface Material {
  id: string
  code: string
  name: string
  description?: string
  unit: string
  specifications?: string
}

interface Vendor {
  id: string
  code: string
  name: string
}

export default function AddPRModal({ isOpen, onClose, onSuccess }: AddPRModalProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loadingDivisions, setLoadingDivisions] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [materialSearches, setMaterialSearches] = useState<{ [key: number]: Material[] }>({})
  const [searchingMaterial, setSearchingMaterial] = useState<{ [key: number]: boolean }>({})
  
  const [formData, setFormData] = useState({
    divisionId: '',
    departmentId: '',
    requiredBy: '',
    priority: 'normal',
    notes: ''
  })
  
  const [items, setItems] = useState<PRItem[]>([{
    itemCode: '',
    itemDescription: '',
    quantity: 1,
    unit: '',
    estimatedPrice: 0,
    specifications: '',
    preferredVendor: '',
    justification: ''
  }])
  
  const [errors, setErrors] = useState<any>({})
  const [itemErrors, setItemErrors] = useState<any[]>([{}])

  // Fetch divisions and vendors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDivisions()
      fetchVendors()
      resetForm()
    }
  }, [isOpen])

  const fetchDivisions = async () => {
    try {
      setLoadingDivisions(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/divisions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDivisions(data.divisions || [])
      }
    } catch (error) {
      console.error('Error fetching divisions:', error)
      toast.error('Failed to load divisions')
    } finally {
      setLoadingDivisions(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vendors?isActive=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const searchMaterials = async (index: number, query: string) => {
    if (!query || query.length < 2) {
      setMaterialSearches(prev => ({ ...prev, [index]: [] }))
      return
    }

    setSearchingMaterial(prev => ({ ...prev, [index]: true }))
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/materials/search/autocomplete?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMaterialSearches(prev => ({ ...prev, [index]: data.materials || [] }))
      }
    } catch (error) {
      console.error('Error searching materials:', error)
    } finally {
      setSearchingMaterial(prev => ({ ...prev, [index]: false }))
    }
  }

  const resetForm = () => {
    setFormData({
      divisionId: '',
      departmentId: '',
      requiredBy: '',
      priority: 'normal',
      notes: ''
    })
    setItems([{
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      unit: '',
      estimatedPrice: 0,
      specifications: '',
      preferredVendor: '',
      justification: ''
    }])
    setErrors({})
    setItemErrors([{}])
    setMaterialSearches({})
    setSearchingMaterial({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleItemChange = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' || field === 'estimatedPrice' ? Number(value) : value
    }
    setItems(newItems)
    
    // Clear error for this field
    if (itemErrors[index]?.[field]) {
      const newItemErrors = [...itemErrors]
      newItemErrors[index] = { ...newItemErrors[index], [field]: undefined }
      setItemErrors(newItemErrors)
    }

    // Trigger material search for item code
    if (field === 'itemCode' && value) {
      searchMaterials(index, value)
    }
  }

  const selectMaterial = (index: number, material: Material) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      itemCode: material.code,
      itemDescription: material.name,
      unit: material.unit,
      specifications: material.specifications || ''
    }
    setItems(newItems)
    setMaterialSearches(prev => ({ ...prev, [index]: [] }))
  }

  const addItem = () => {
    setItems([...items, {
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      unit: '',
      estimatedPrice: 0,
      specifications: '',
      preferredVendor: '',
      justification: ''
    }])
    setItemErrors([...itemErrors, {}])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      const newItemErrors = itemErrors.filter((_, i) => i !== index)
      setItems(newItems)
      setItemErrors(newItemErrors)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: any = {}
    const newItemErrors: any[] = []

    // Validate main form
    if (!formData.divisionId) newErrors.divisionId = 'Division is required'
    if (!formData.requiredBy) newErrors.requiredBy = 'Required by date is required'
    
    // Validate required by date is in future
    const requiredByDate = new Date(formData.requiredBy)
    if (requiredByDate <= new Date()) {
      newErrors.requiredBy = 'Required by date must be in the future'
    }

    // Validate items
    items.forEach((item, index) => {
      const itemError: any = {}
      if (!item.itemCode.trim()) itemError.itemCode = 'Item code is required'
      if (!item.itemDescription.trim()) itemError.itemDescription = 'Description is required'
      if (item.quantity <= 0) itemError.quantity = 'Quantity must be greater than 0'
      if (!item.unit.trim()) itemError.unit = 'Unit is required'
      newItemErrors.push(itemError)
    })

    setErrors(newErrors)
    setItemErrors(newItemErrors)
    
    const hasMainErrors = Object.keys(newErrors).length > 0
    const hasItemErrors = newItemErrors.some(error => Object.keys(error).length > 0)
    
    return !hasMainErrors && !hasItemErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-requisitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          items
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Purchase requisition created successfully')
        onSuccess()
        onClose()
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: any) => {
            toast.error(error.message)
          })
        } else {
          toast.error(data.error || 'Failed to create purchase requisition')
        }
      }
    } catch (error) {
      console.error('Error creating PR:', error)
      toast.error('Failed to create purchase requisition')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * (item.estimatedPrice || 0)), 0)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Purchase Requisition</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Request materials or services for your division</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Basic Information */}
              <div className="space-y-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-gray-400" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Division *
                    </label>
                    {loadingDivisions ? (
                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Loading divisions...</span>
                      </div>
                    ) : (
                      <select
                        name="divisionId"
                        value={formData.divisionId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.divisionId 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      >
                        <option value="">Select Division</option>
                        {divisions.map(division => (
                          <option key={division.id} value={division.id}>
                            {division.name} ({division.code})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.divisionId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.divisionId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., IT, Production, Maintenance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Required By Date *
                    </label>
                    <input
                      type="date"
                      name="requiredBy"
                      value={formData.requiredBy}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.requiredBy 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {errors.requiredBy && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.requiredBy}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Additional notes or special instructions..."
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item {index + 1}
                        </h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Code *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              className={`w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                itemErrors[index]?.itemCode 
                                  ? 'border-red-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              placeholder="Search material..."
                            />
                            {searchingMaterial[index] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                              </div>
                            )}
                          </div>
                          {itemErrors[index]?.itemCode && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{itemErrors[index].itemCode}</p>
                          )}
                          
                          {/* Material search results */}
                          {materialSearches[index] && materialSearches[index].length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {materialSearches[index].map((material) => (
                                <button
                                  key={material.id}
                                  type="button"
                                  onClick={() => selectMaterial(index, material)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-2"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{material.code}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{material.name}</div>
                                    {material.specifications && (
                                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{material.specifications}</div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{material.unit}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              itemErrors[index]?.itemDescription 
                                ? 'border-red-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            placeholder="e.g., Steel pipes 2 inch"
                          />
                          {itemErrors[index]?.itemDescription && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{itemErrors[index].itemDescription}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="0.01"
                            step="0.01"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              itemErrors[index]?.quantity 
                                ? 'border-red-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          />
                          {itemErrors[index]?.quantity && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{itemErrors[index].quantity}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit *
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              itemErrors[index]?.unit 
                                ? 'border-red-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            placeholder="e.g., PCS, KG, MTR"
                          />
                          {itemErrors[index]?.unit && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{itemErrors[index].unit}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estimated Price
                          </label>
                          <input
                            type="number"
                            value={item.estimatedPrice}
                            onChange={(e) => handleItemChange(index, 'estimatedPrice', e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Preferred Vendor
                          </label>
                          <select
                            value={item.preferredVendor}
                            onChange={(e) => handleItemChange(index, 'preferredVendor', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select vendor (optional)</option>
                            {vendors.map(vendor => (
                              <option key={vendor.id} value={vendor.name}>
                                {vendor.name} ({vendor.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Specifications
                          </label>
                          <textarea
                            value={item.specifications}
                            onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Technical specifications, quality requirements, etc."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Estimation */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estimated Total Value:
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-4 w-4" />
                <span>PR will be saved as draft. You can submit it for approval later.</span>
              </div>
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
                    'Create PR'
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