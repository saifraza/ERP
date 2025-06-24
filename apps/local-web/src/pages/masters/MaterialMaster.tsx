import { useState, useEffect } from 'react'
import { 
  Package, Plus, Search, Filter, Download, Upload, 
  Edit, Eye, MoreVertical, Tag, Box, AlertCircle,
  CheckCircle, XCircle, Barcode
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
  unit: string
  hsnCode?: string
  specifications?: string
  reorderLevel?: number
  reorderQuantity?: number
  minOrderQuantity?: number
  leadTimeDays: number
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
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchMaterials()
  }, [currentCompany, selectedCategory, selectedStatus])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active' ? 'true' : 'false')
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

  const getCategoryColor = (category: string) => {
    const colors = {
      raw_material: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      consumable: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      spare_part: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      chemical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      packing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      raw_material: 'Raw Material',
      consumable: 'Consumable',
      spare_part: 'Spare Part',
      chemical: 'Chemical',
      packing: 'Packing',
      other: 'Other'
    }
    return labels[category as keyof typeof labels] || category
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
          <button className="btn-secondary flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="btn-secondary flex items-center gap-2">
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Raw Materials</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.filter(m => m.category === 'raw_material').length}
              </p>
            </div>
            <Box className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Spare Parts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {materials.filter(m => m.category === 'spare_part').length}
              </p>
            </div>
            <Tag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
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
            <option value="raw_material">Raw Material</option>
            <option value="consumable">Consumable</option>
            <option value="spare_part">Spare Part</option>
            <option value="chemical">Chemical</option>
            <option value="packing">Packing</option>
            <option value="other">Other</option>
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
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    HSN Code
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
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {material.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {material.hsnCode || '-'}
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
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="More Options"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
    </div>
  )
}