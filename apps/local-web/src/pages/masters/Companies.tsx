import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Edit2, Factory, MapPin, Phone, Mail, Plus, Trash2 } from 'lucide-react'
import { useCompanyStore } from '../../stores/companyStore'
import { AddCompanyModal, EditCompanyModal, DeleteCompanyModal } from '../../components/masters/CompanyModals'
import { toast } from 'react-hot-toast'

export default function Companies() {
  const navigate = useNavigate()
  const { companies, currentCompany, setCurrentCompany, fetchCompanies } = useCompanyStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your company details and factories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </button>
      </div>

      {/* Companies List */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first company</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
                currentCompany?.id === company.id ? 'border-primary-500' : 'border-gray-200'
              }`}
            >
              {/* Company Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Building className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-600">{company.legalName}</p>
                    {currentCompany?.id === company.id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCompany(company)
                      setShowEditModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Edit Company"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentCompany?.id === company.id && companies.length > 1) {
                        toast.error('Cannot delete current company. Switch to another company first.')
                        return
                      }
                      setSelectedCompany(company)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete Company"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{company.city}, {company.state} - {company.pincode}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{company.email}</span>
                </div>
              </div>

              {/* Tax Info */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">GST Number</p>
                  <p className="text-sm font-medium text-gray-900">{company.gstNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PAN Number</p>
                  <p className="text-sm font-medium text-gray-900">{company.panNumber}</p>
                </div>
              </div>

              {/* Factories */}
              {company.factories && company.factories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Factories</h4>
                  <div className="space-y-2">
                    {company.factories.map((factory) => (
                      <div
                        key={factory.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <Factory className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{factory.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({factory.type})</span>
                        </div>
                        <span className="text-xs text-gray-500">{factory.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {currentCompany?.id !== company.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentCompany(company)}
                    className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                  >
                    Switch to this Company
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchCompanies()
        }}
      />

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedCompany(null)
        }}
        onSuccess={() => {
          setShowEditModal(false)
          setSelectedCompany(null)
          fetchCompanies()
        }}
        company={selectedCompany}
      />

      {/* Delete Company Modal */}
      <DeleteCompanyModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedCompany(null)
        }}
        onSuccess={() => {
          setShowDeleteModal(false)
          setSelectedCompany(null)
          fetchCompanies()
        }}
        company={selectedCompany}
      />
    </div>
  )
}