import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Plus, Search, Filter, Download, Upload, 
  Phone, Mail, MapPin, Building2, CreditCard,
  FileText, Package, CheckCircle, Edit, Eye, MoreVertical
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import AddVendorModal from '../../components/procurement/AddVendorModal'
import EditVendorModal from '../../components/procurement/EditVendorModal'

interface Vendor {
  id: string
  code: string
  name: string
  type: string
  email?: string
  phone: string
  city: string
  state: string
  creditLimit: number
  creditDays: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function VendorMaster() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [currentCompany, selectedType, selectedStatus])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active' ? 'true' : 'false')
      if (selectedType !== 'all') params.append('type', selectedType)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vendors?${params}`,
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
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVendors()
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
        Inactive
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      MATERIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      SERVICE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      TRANSPORTER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      CONTRACTOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }

    const labels = {
      MATERIAL: 'Material',
      SERVICE: 'Service',
      TRANSPORTER: 'Transporter',
      CONTRACTOR: 'Contractor',
      OTHER: 'Other'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Master</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage vendor master data and information</p>
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
            New Vendor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.filter(v => v.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Material Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.filter(v => v.type === 'MATERIAL').length}
              </p>
            </div>
            <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Service Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.filter(v => v.type === 'SERVICE').length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
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
                placeholder="Search by name, code, email, or phone..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="MATERIAL">Material</option>
            <option value="SERVICE">Service</option>
            <option value="TRANSPORTER">Transporter</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="OTHER">Other</option>
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

      {/* Vendors Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              Loading vendors...
            </div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No vendors found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn-primary"
            >
              Add First Vendor
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
                    Vendor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credit Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {vendor.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{vendor.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(vendor.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {vendor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {vendor.city}, {vendor.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          ₹{(vendor.creditLimit / 100000).toFixed(1)}L
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vendor.creditDays} days
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(vendor.isActive)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(vendor.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/procurement/vendors/${vendor.id}`)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setShowEditModal(true)
                          }}
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

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchVendors()
        }}
      />
      
      {/* Edit Vendor Modal */}
      <EditVendorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedVendor(null)
        }}
        onSuccess={() => {
          setShowEditModal(false)
          setSelectedVendor(null)
          fetchVendors()
        }}
        vendor={selectedVendor}
      />
    </div>
  )
}