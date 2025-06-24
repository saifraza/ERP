import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Package, Building, Calendar, AlertCircle, Search } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface AddRequisitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface RequisitionItem {
  materialId: string
  quantity: number
  requiredDate: string
  specification?: string
  remarks?: string
  // For display purposes
  materialCode?: string
  materialName?: string
  unit?: string
}

interface Factory {
  id: string
  name: string
  code: string
  type: string
}

interface Material {
  id: string
  code: string
  name: string
  description?: string
  unit: string
  specifications?: string
  category: string
  reorderLevel?: number
  leadTimeDays?: number
}

export default function AddRequisitionModal({ isOpen, onClose, onSuccess }: AddRequisitionModalProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [factories, setFactories] = useState<Factory[]>([])
  const [loadingFactories, setLoadingFactories] = useState(false)
  const [materialSearches, setMaterialSearches] = useState<{ [key: number]: Material[] }>({})
  const [searchingMaterial, setSearchingMaterial] = useState<{ [key: number]: boolean }>({})
  
  const [formData, setFormData] = useState({
    factoryId: '',
    department: '',
    priority: 'NORMAL',
    purpose: '',
    remarks: ''
  })
  
  const [items, setItems] = useState<RequisitionItem[]>([{
    materialId: '',
    materialCode: '',
    materialName: '',
    quantity: 1,
    unit: '',
    requiredDate: '',
    specification: '',
    remarks: ''
  }])
  
  const [errors, setErrors] = useState<any>({})
  const [itemErrors, setItemErrors] = useState<any[]>([{}])

  // Fetch factories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFactories()
      resetForm()
    }
  }, [isOpen])

  const fetchFactories = async () => {
    try {
      setLoadingFactories(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/companies/my/factories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFactories(data.factories || [])
      }
    } catch (error) {
      console.error('Error fetching factories:', error)
      toast.error('Failed to load factories')
    } finally {
      setLoadingFactories(false)
    }
  }

  const searchMaterials = async (index: number, searchTerm: string) => {
    if (searchTerm.length < 2) {
      setMaterialSearches(prev => ({ ...prev, [index]: [] }))
      return
    }

    try {
      setSearchingMaterial(prev => ({ ...prev, [index]: true }))
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/search/autocomplete?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

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
      factoryId: '',
      department: '',
      priority: 'NORMAL',
      purpose: '',
      remarks: ''
    })
    setItems([{
      materialId: '',
      materialCode: '',
      materialName: '',
      quantity: 1,
      unit: '',
      requiredDate: '',
      specification: '',
      remarks: ''
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

  const handleItemChange = (index: number, field: keyof RequisitionItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? Number(value) : value
    }
    setItems(newItems)
    
    // Clear error for this field
    if (itemErrors[index]?.[field]) {
      const newItemErrors = [...itemErrors]
      newItemErrors[index] = { ...newItemErrors[index], [field]: undefined }
      setItemErrors(newItemErrors)
    }

    // Trigger material search for material code
    if (field === 'materialCode' && value) {
      searchMaterials(index, value)
    }
  }

  const selectMaterial = (index: number, material: Material) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      materialId: material.id,
      materialCode: material.code,
      materialName: material.name,
      unit: material.unit,
      specification: material.specifications || ''
    }
    setItems(newItems)
    setMaterialSearches(prev => ({ ...prev, [index]: [] }))
  }

  const addItem = () => {
    setItems([...items, {
      materialId: '',
      materialCode: '',
      materialName: '',
      quantity: 1,
      unit: '',
      requiredDate: '',
      specification: '',
      remarks: ''
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
    if (!formData.factoryId) newErrors.factoryId = 'Factory is required'
    if (!formData.department) newErrors.department = 'Department is required'
    
    // Validate items
    let hasItemErrors = false
    items.forEach((item, index) => {
      const itemError: any = {}
      
      if (!item.materialId) {
        itemError.materialCode = 'Material is required'
        hasItemErrors = true
      }
      if (!item.quantity || item.quantity <= 0) {
        itemError.quantity = 'Valid quantity is required'
        hasItemErrors = true
      }
      if (!item.requiredDate) {
        itemError.requiredDate = 'Required date is required'
        hasItemErrors = true
      } else {
        const requiredDate = new Date(item.requiredDate)
        if (requiredDate < new Date()) {
          itemError.requiredDate = 'Required date cannot be in the past'
          hasItemErrors = true
        }
      }
      
      newItemErrors.push(itemError)
    })

    setErrors(newErrors)
    setItemErrors(newItemErrors)

    return Object.keys(newErrors).length === 0 && !hasItemErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    setLoading(true)
    try {
      // Prepare items for submission
      const requisitionItems = items.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        requiredDate: item.requiredDate,
        specification: item.specification,
        remarks: item.remarks
      }))

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requisitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          items: requisitionItems
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Requisition created: ${data.requisition.requisitionNo}`)
        onSuccess()
        onClose()
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: any) => {
            toast.error(error.message)
          })
        } else {
          toast.error(data.error || 'Failed to create requisition')
        }
      }
    } catch (error) {
      console.error('Error creating requisition:', error)
      toast.error('Failed to create requisition')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const calculateDefaultRequiredDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7) // Default to 7 days from now
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Material Requisition</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Request materials from inventory</p>
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
                      Factory *
                    </label>
                    {loadingFactories ? (
                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Loading factories...</span>
                      </div>
                    ) : (
                      <select
                        name="factoryId"
                        value={formData.factoryId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.factoryId 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      >
                        <option value="">Select Factory</option>
                        {factories.map(factory => (
                          <option key={factory.id} value={factory.id}>
                            {factory.name} ({factory.code}) - {factory.type}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.factoryId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.factoryId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.department 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="e.g., Production, Maintenance, Lab"
                    />
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
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
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purpose
                    </label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Brief purpose of requisition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Any additional remarks or instructions"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    Material Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Material Code *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.materialCode}
                              onChange={(e) => handleItemChange(index, 'materialCode', e.target.value)}
                              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                itemErrors[index]?.materialCode 
                                  ? 'border-red-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              placeholder="Search material..."
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          {itemErrors[index]?.materialCode && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{itemErrors[index].materialCode}</p>
                          )}
                          
                          {/* Material search results */}
                          {materialSearches[index]?.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {materialSearches[index].map((material) => (
                                <button
                                  key={material.id}
                                  type="button"
                                  onClick={() => selectMaterial(index, material)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {material.code} - {material.name}
                                  </div>
                                  {material.description && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                      {material.description}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {searchingMaterial[index] && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                Searching...
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Material Name
                          </label>
                          <input
                            type="text"
                            value={item.materialName}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            placeholder="Auto-filled"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            placeholder="Auto-filled"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              itemErrors[index]?.quantity 
                                ? 'border-red-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            min="0.01"
                            step="0.01"
                          />
                          {itemErrors[index]?.quantity && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{itemErrors[index].quantity}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Required Date *
                          </label>
                          <input
                            type="date"
                            value={item.requiredDate}
                            onChange={(e) => handleItemChange(index, 'requiredDate', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              itemErrors[index]?.requiredDate 
                                ? 'border-red-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          {itemErrors[index]?.requiredDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{itemErrors[index].requiredDate}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Specification
                          </label>
                          <input
                            type="text"
                            value={item.specification}
                            onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Additional specifications"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Item Remarks
                          </label>
                          <textarea
                            value={item.remarks}
                            onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Remarks for this item"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info message */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Material Requisition Process
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This requisition will be submitted for approval. Once approved, it can be converted to a Purchase Order or fulfilled from existing inventory.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                * Required fields
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
                    'Create Requisition'
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