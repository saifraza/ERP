import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Users, Plus, Search, Filter, Download, Upload, 
  Phone, Mail, MapPin, Star, TrendingUp, IndianRupee,
  Edit, Eye, MoreVertical, Building2, CreditCard,
  FileText, Package, AlertCircle, CheckCircle,
  Ban, Power, Copy, Send, MoreHorizontal
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { toast } from 'react-hot-toast'
import AddVendorModal from '../../components/procurement/AddVendorModal'
import EditVendorModal from '../../components/procurement/EditVendorModal'
import DenseTable, { Column } from '../../components/DenseTable'

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
  _count?: {
    purchaseOrders?: number
    invoices?: number
    payments?: number
  }
}

export default function Vendors() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const navigate = useNavigate()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  useEffect(() => {
    fetchVendors()
  }, [currentCompany, selectedStatus])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.relative')) {
        setShowDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active' ? 'true' : 'false')
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

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MATERIAL':
        return '📦'
      case 'SERVICE':
        return '🛠️'
      case 'TRANSPORTER':
        return '🚚'
      case 'CONTRACTOR':
        return '🔧'
      case 'OTHER':
        return '📋'
      default:
        return '📋'
    }
  }

  const vendorColumns: Column<Vendor>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      width: '25%',
      render: (vendor) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="cell-primary truncate">{vendor.name}</p>
            <p className="cell-secondary">{vendor.code}</p>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      width: '15%',
      render: (vendor) => (
        <div className="flex items-center gap-1">
          <span className="text-base">{getTypeIcon(vendor.type)}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
            {vendor.type.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      width: '20%',
      render: (vendor) => (
        <div className="space-y-0.5">
          {vendor.email && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              <span className="truncate">{vendor.email}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Phone className="h-3 w-3" />
            {vendor.phone}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            {vendor.city}, {vendor.state}
          </div>
        </div>
      )
    },
    {
      key: 'credit',
      header: 'Credit',
      width: '10%',
      render: (vendor) => (
        <div>
          <p className="cell-primary">₹{(vendor.creditLimit / 100000).toFixed(1)}L</p>
          <p className="cell-secondary">{vendor.creditDays} days</p>
        </div>
      )
    },
    {
      key: 'business',
      header: 'Business',
      width: '15%',
      render: (vendor) => (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-0.5">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {vendor._count?.purchaseOrders || 0}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <FileText className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {vendor._count?.invoices || 0}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <IndianRupee className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {vendor._count?.payments || 0}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (vendor) => (
        <span className={`status-pill ${getStatusColor(vendor.isActive)}`}>
          {vendor.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your suppliers and service providers</p>
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
            Add Vendor
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
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.filter(v => v.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {vendors.reduce((sum, v) => sum + (v._count?.purchaseOrders || 0), 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Credit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{(vendors.reduce((sum, v) => sum + v.creditLimit, 0) / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
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
                placeholder="Search vendors by name, code, or email..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

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
      <DenseTable<Vendor>
        data={vendors}
        columns={vendorColumns}
        loading={loading}
        rowKey={(vendor) => vendor.id}
        onRowClick={(vendor) => navigate(`/procurement/vendors/${vendor.id}`)}
        selectedRows={selectedVendors}
        onSelectRow={(id) => setSelectedVendors(prev => 
          prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        )}
        onSelectAll={(selected) => setSelectedVendors(selected ? vendors.map(v => v.id) : [])}
        rowActions={(vendor) => (
          <>
            <Link
              to={`/procurement/vendors/${vendor.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Link>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setSelectedVendor(vendor)
                setShowEditModal(true)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Edit vendor"
            >
              <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(showDropdown === vendor.id ? null : vendor.id)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              {showDropdown === vendor.id && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vendor.email || '')
                      toast.success('Email copied to clipboard')
                      setShowDropdown(null)
                    }}
                    disabled={!vendor.email}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Email
                  </button>
                  <button
                    onClick={() => {
                      if (vendor.email) {
                        window.location.href = `mailto:${vendor.email}`
                      }
                      setShowDropdown(null)
                    }}
                    disabled={!vendor.email}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    Send Email
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${import.meta.env.VITE_API_URL}/api/vendors/${vendor.id}`,
                          {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ isActive: !vendor.isActive })
                          }
                        )
                        if (response.ok) {
                          toast.success(`Vendor ${vendor.isActive ? 'deactivated' : 'activated'} successfully`)
                          fetchVendors()
                        }
                      } catch (error) {
                        toast.error('Failed to update vendor status')
                      }
                      setShowDropdown(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {vendor.isActive ? (
                      <><Ban className="h-4 w-4" /> Deactivate</>
                    ) : (
                      <><Power className="h-4 w-4" /> Activate</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        emptyMessage="No vendors found"
      />

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
      {selectedVendor && (
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
      )}
    </div>
  )
}