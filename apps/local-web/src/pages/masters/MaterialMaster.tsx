import { useState, useEffect } from 'react'
import { 
  Package, Plus, Search, Filter, Download, Upload, 
  Edit, Eye, MoreVertical, Tag, Box, AlertCircle,
  CheckCircle, XCircle, Barcode, Shield, Beaker, Trash2, X
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import AddMaterialModal from '../../components/masters/AddMaterialModal'

interface Material {
  id: string
  code: string
  name: string
  description?: string
  category: string
  subCategory?: string
  industryCategory?: string
  division: string
  unit: string
  hsnCode?: string
  technicalGrade?: string
  complianceStandard?: string
  specifications?: string
  criticalItem: boolean
  shelfLife?: number
  storageConditions?: string
  hazardCategory?: string
  reorderLevel?: number
  reorderQuantity?: number
  minOrderQuantity?: number
  maxOrderQuantity?: number
  leadTimeDays: number
  preferredVendors?: string
  qualityParameters?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function MaterialMaster() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchMaterials()
  }, [currentCompany, selectedCategory, selectedDivision, selectedStatus, criticalOnly])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedDivision !== 'all') params.append('division', selectedDivision)
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active' ? 'true' : 'false')
      if (criticalOnly) params.append('criticalItem', 'true')
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMaterials()
  }

  const toggleMaterialStatus = async (materialId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/${materialId}/toggle-status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Material status updated')
        fetchMaterials()
      } else {
        toast.error('Failed to update material status')
      }
    } catch (error) {
      console.error('Error toggling material status:', error)
      toast.error('Failed to update material status')
    }
  }

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setShowViewModal(true)
  }

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setShowEditModal(true)
  }

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/${selectedMaterial.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Material deleted successfully')
        setShowDeleteConfirm(false)
        setSelectedMaterial(null)
        fetchMaterials()
      } else {
        toast.error('Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Failed to delete material')
    }
  }

  const handleExport = () => {
    // Convert materials to CSV
    const headers = ['Code', 'Name', 'Category', 'Division', 'Unit', 'Status']
    const csvData = materials.map(m => [
      m.code,
      m.name,
      getCategoryLabel(m.category),
      getDivisionLabel(m.division),
      m.unit,
      m.isActive ? 'Active' : 'Inactive'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `materials_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Materials exported successfully')
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      RAW_MATERIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      CONSUMABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SPARE_PART: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      CHEMICAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      PACKING_MATERIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      FUEL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      FINISHED_GOODS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      SEMI_FINISHED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[category as keyof typeof colors] || colors.OTHER
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      RAW_MATERIAL: 'Raw Material',
      CONSUMABLE: 'Consumable',
      SPARE_PART: 'Spare Part',
      CHEMICAL: 'Chemical',
      PACKING_MATERIAL: 'Packing',
      FUEL: 'Fuel',
      FINISHED_GOODS: 'Finished Goods',
      SEMI_FINISHED: 'Semi Finished',
      OTHER: 'Other'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getDivisionColor = (division: string) => {
    const colors = {
      sugar: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      ethanol: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      power: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      feed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      common: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[division as keyof typeof colors] || colors.common
  }

  const getDivisionLabel = (division: string) => {
    const labels = {
      sugar: 'Sugar',
      ethanol: 'Ethanol',
      power: 'Power',
      feed: 'Feed',
      common: 'Common'
    }
    return labels[division as keyof typeof labels] || division
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Material Master</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage material codes and specifications</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => toast.info('Import feature coming soon')}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Material
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.filter(m => m.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.filter(m => m.criticalItem).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chemicals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.filter(m => m.category === 'CHEMICAL').length}
              </p>
            </div>
            <Beaker className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, name, or description..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="CONSUMABLE">Consumable</option>
            <option value="SPARE_PART">Spare Part</option>
            <option value="CHEMICAL">Chemical</option>
            <option value="PACKING_MATERIAL">Packing Material</option>
            <option value="FUEL">Fuel</option>
            <option value="FINISHED_GOODS">Finished Goods</option>
            <option value="SEMI_FINISHED">Semi Finished</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Divisions</option>
            <option value="sugar">Sugar</option>
            <option value="ethanol">Ethanol</option>
            <option value="power">Power</option>
            <option value="feed">Animal Feed</option>
            <option value="common">Common</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => setCriticalOnly(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Critical Only</span>
          </label>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              Loading materials...
            </div>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No materials found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn-primary"
            >
              Add First Material
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Material Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{material.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{material.name}</p>
                        {material.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{material.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(material.category)}`}>
                        {getCategoryLabel(material.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDivisionColor(material.division)}`}>
                        {getDivisionLabel(material.division)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {material.unit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {material.complianceStandard && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{material.complianceStandard}</span>
                          </div>
                        )}
                        {material.hazardCategory && material.hazardCategory !== 'Non-Hazardous' && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600 dark:text-orange-400">{material.hazardCategory}</span>
                          </div>
                        )}
                        {material.criticalItem && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Critical
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {material.reorderLevel && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              ROL: {material.reorderLevel}
                            </span>
                          </div>
                        )}
                        {material.minOrderQuantity && (
                          <div className="text-gray-600 dark:text-gray-400">
                            MOQ: {material.minOrderQuantity}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMaterialStatus(material.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          material.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        } cursor-pointer hover:opacity-80`}
                      >
                        {material.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewMaterial(material)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => handleEditMaterial(material)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedMaterial(material)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Material Modal */}
      <AddMaterialModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchMaterials()
        }}
      />

      {/* View Material Modal */}
      {showViewModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setShowViewModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Material Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Material Code</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getCategoryLabel(selectedMaterial.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Division</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getDivisionLabel(selectedMaterial.division)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unit</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  {selectedMaterial.hsnCode && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">HSN Code</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.hsnCode}</p>
                    </div>
                  )}
                  {selectedMaterial.criticalItem && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Critical Item</p>
                      <p className="font-medium text-red-600 dark:text-red-400">Yes</p>
                    </div>
                  )}
                  {selectedMaterial.technicalGrade && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Technical Grade</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.technicalGrade}</p>
                    </div>
                  )}
                  {selectedMaterial.complianceStandard && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Standard</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.complianceStandard}</p>
                    </div>
                  )}
                  {selectedMaterial.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.description}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Specifications</p>
                      <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMaterial.specifications}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Material</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Are you sure you want to delete material <strong>{selectedMaterial.code} - {selectedMaterial.name}</strong>?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteMaterial}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}