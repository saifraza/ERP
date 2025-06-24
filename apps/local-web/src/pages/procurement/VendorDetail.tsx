import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Building2, Mail, Phone, MapPin, CreditCard, Calendar, Package, FileText, DollarSign, TrendingUp, Clock, Truck } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import EditVendorModal from '../../components/procurement/EditVendorModal'

interface Vendor {
  id: string
  code: string
  name: string
  type: string
  gstNumber?: string
  panNumber?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  contactPerson?: string
  email?: string
  phone: string
  bankName?: string
  bankAccount?: string
  bankIFSC?: string
  creditLimit: number
  creditDays: number
  isActive: boolean
  createdAt: string
  purchaseOrders?: any[]
  invoices?: any[]
}

interface VendorStats {
  totalBusiness: number
  pendingPayments: number
  avgDeliveryDays: number
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'invoices' | 'documents'>('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchVendor = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vendors/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVendor(data.vendor)
        setStats(data.stats)
      } else {
        toast.error('Failed to fetch vendor details')
        navigate('/procurement/vendors')
      }
    } catch (error) {
      console.error('Error fetching vendor:', error)
      toast.error('Failed to fetch vendor details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendor()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!vendor) {
    return null
  }

  const vendorTypeLabels = {
    MATERIAL: 'Material Supplier',
    SERVICE: 'Service Provider',
    TRANSPORTER: 'Transporter',
    CONTRACTOR: 'Contractor',
    OTHER: 'Other'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/procurement/vendors')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{vendor.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Code: {vendor.code} • {vendorTypeLabels[vendor.type as keyof typeof vendorTypeLabels]}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Vendor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Business</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{stats.totalBusiness.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{stats.pendingPayments.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Delivery</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.avgDeliveryDays} days</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Documents
          </button>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                <div className="space-y-3">
                  {vendor.contactPerson && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Contact Person</p>
                        <p className="text-gray-900 dark:text-white">{vendor.contactPerson}</p>
                      </div>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="text-gray-900 dark:text-white">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white">{vendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                      <p className="text-gray-900 dark:text-white">
                        {vendor.addressLine1}
                        {vendor.addressLine2 && <><br />{vendor.addressLine2}</>}
                        <br />
                        {vendor.city}, {vendor.state} - {vendor.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Financial Information</h3>
                <div className="space-y-3">
                  {vendor.gstNumber && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">GST Number</p>
                        <p className="text-gray-900 dark:text-white">{vendor.gstNumber}</p>
                      </div>
                    </div>
                  )}
                  {vendor.panNumber && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">PAN Number</p>
                        <p className="text-gray-900 dark:text-white">{vendor.panNumber}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Credit Limit</p>
                      <p className="text-gray-900 dark:text-white">₹{vendor.creditLimit.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Credit Days</p>
                      <p className="text-gray-900 dark:text-white">{vendor.creditDays} days</p>
                    </div>
                  </div>
                  {vendor.bankName && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bank Details</p>
                        <p className="text-gray-900 dark:text-white">
                          {vendor.bankName}
                          {vendor.bankAccount && <><br />A/C: {vendor.bankAccount}</>}
                          {vendor.bankIFSC && <><br />IFSC: {vendor.bankIFSC}</>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              {vendor.purchaseOrders && vendor.purchaseOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">PO Number</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.purchaseOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{order.poNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ₹{order.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No purchase orders yet</p>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              {vendor.invoices && vendor.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Paid</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ₹{invoice.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ₹{invoice.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Document management coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditVendorModal
          vendor={vendor}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchVendor()
            setIsEditModalOpen(false)
          }}
        />
      )}
    </div>
  )
}