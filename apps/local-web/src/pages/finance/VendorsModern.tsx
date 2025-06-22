import { useState } from 'react'
import { 
  Plus, Search, Filter, ChevronDown, MoreVertical, 
  Mail, Phone, MapPin, Star, TrendingUp, FileText,
  CheckCircle, XCircle, Clock, Download, Upload, Users
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Modern vendor card component
const VendorCard = ({ vendor }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'blacklisted': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'unverified':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {vendor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                {getVerificationIcon(vendor.verificationStatus)}
              </div>
              <p className="text-sm text-gray-500">{vendor.code}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Status and Categories */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vendor.status)}`}>
            {vendor.status}
          </span>
          {vendor.category.slice(0, 2).map((cat: string, index: number) => (
            <span key={index} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {cat}
            </span>
          ))}
          {vendor.category.length > 2 && (
            <span className="text-xs text-gray-500">+{vendor.category.length - 2}</span>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            {vendor.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            {vendor.phone}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            {vendor.city}, {vendor.state}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-50 px-6 py-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-500">Rating</p>
          <div className="flex items-center justify-center mt-1">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="font-semibold text-gray-900">{vendor.rating}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Business</p>
          <p className="font-semibold text-gray-900 mt-1">₹{(vendor.totalBusiness / 100000).toFixed(1)}L</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">On-time</p>
          <p className="font-semibold text-gray-900 mt-1">{vendor.onTimeDelivery}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
        <Link to={`/finance/vendors/${vendor.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View Details
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Mail className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FileText className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Stats card component
const StatsCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function VendorsModern() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Sample vendors data
  const vendors = [
    {
      id: '1',
      code: 'VEN001',
      name: 'ABC Suppliers Ltd',
      type: 'supplier',
      category: ['spare_parts', 'consumables'],
      email: 'contact@abcsuppliers.com',
      phone: '+91 98765 43210',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'active',
      verificationStatus: 'verified',
      rating: 4.5,
      totalBusiness: 2500000,
      onTimeDelivery: 95,
      paymentTerms: 30,
      creditLimit: 500000
    },
    {
      id: '2',
      code: 'VEN002',
      name: 'XYZ Industries',
      type: 'contractor',
      category: ['services', 'maintenance'],
      email: 'info@xyzindustries.com',
      phone: '+91 98765 43211',
      city: 'Pune',
      state: 'Maharashtra',
      status: 'pending',
      verificationStatus: 'unverified',
      rating: 4.2,
      totalBusiness: 1800000,
      onTimeDelivery: 88,
      paymentTerms: 45,
      creditLimit: 300000
    }
  ]

  const stats = [
    { title: 'Total Vendors', value: '145', subtitle: '12 added this month', icon: Users, color: 'bg-blue-500' },
    { title: 'Active', value: '132', subtitle: '91% of total', icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Pending', value: '8', subtitle: 'Awaiting verification', icon: Clock, color: 'bg-yellow-500' },
    { title: 'Avg Rating', value: '4.3', subtitle: 'Out of 5.0', icon: Star, color: 'bg-purple-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your suppliers, contractors, and service providers</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="h-5 w-5 mr-2 text-gray-500" />
                Import
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-5 w-5 mr-2 text-gray-500" />
                Export
              </button>
              <Link
                to="/finance/vendors/new"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Vendor
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, code, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>

            {/* Category Filter */}
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2 text-gray-500" />
              More Filters
              <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* List view implementation would go here */}
            <p className="p-6 text-gray-500">List view coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}