import { useNavigate } from 'react-router-dom'
import { Building, Edit2, Factory, MapPin, Phone, Mail, Plus } from 'lucide-react'
import { useCompanyStore } from '../../stores/companyStore'

export default function Companies() {
  const navigate = useNavigate()
  const { companies, currentCompany, setCurrentCompany } = useCompanyStore()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your company details and factories</p>
        </div>
        <button
          onClick={() => navigate('/setup')}
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
            onClick={() => navigate('/setup')}
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
                <button
                  onClick={() => {
                    setCurrentCompany(company)
                    navigate('/masters/companies/edit')
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
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
    </div>
  )
}