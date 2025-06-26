import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Factory, CheckCircle, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react'
import { useCompanyStore } from '../../stores/companyStore'
import CompanyInfo from '../setup/CompanyInfo'
import FactorySetup from '../setup/FactorySetup'
import toast from 'react-hot-toast'
import type { CompanyData, FactoryData } from '../setup/CompanySetup'

const steps = [
  { id: 1, name: 'Company Information', icon: Building },
  { id: 2, name: 'Factory Setup', icon: Factory },
  { id: 3, name: 'Review & Save', icon: CheckCircle },
]

export default function CompanyEditWizard() {
  const navigate = useNavigate()
  const { currentCompany, companies, setCompanies, setCurrentCompany } = useCompanyStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [factories, setFactories] = useState<FactoryData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize with current company data
  useEffect(() => {
    if (currentCompany) {
      // Convert current company data to CompanyData format
      const initialCompanyData: CompanyData = {
        name: currentCompany.name,
        legalName: currentCompany.legalName,
        gstNumber: currentCompany.gstNumber,
        panNumber: currentCompany.panNumber,
        tanNumber: currentCompany.tanNumber || '',
        cinNumber: currentCompany.cinNumber || '',
        addressLine1: currentCompany.addressLine1,
        addressLine2: currentCompany.addressLine2 || '',
        city: currentCompany.city,
        state: currentCompany.state,
        pincode: currentCompany.pincode,
        email: currentCompany.email,
        phone: currentCompany.phone,
        website: currentCompany.website || '',
        fyStartMonth: currentCompany.fyStartMonth || 4,
        currentFY: currentCompany.currentFY || '2024-25',
        logo: undefined,
        letterhead: undefined
      }
      setCompanyData(initialCompanyData)

      // Convert factories if they exist
      if (currentCompany.factories && Array.isArray(currentCompany.factories)) {
        const initialFactories: FactoryData[] = currentCompany.factories.map((factory: any) => ({
          name: factory.name,
          type: factory.type || 'integrated',
          addressLine1: factory.addressLine1 || '',
          addressLine2: factory.addressLine2,
          city: factory.city || '',
          state: factory.state || '',
          pincode: factory.pincode || '',
          crushingCapacity: factory.crushingCapacity,
          powerCapacity: factory.powerCapacity,
          ethanolCapacity: factory.ethanolCapacity,
          feedCapacity: factory.feedCapacity,
          gstNumber: factory.gstNumber,
          factoryLicense: factory.factoryLicense,
          pollutionLicense: factory.pollutionLicense
        }))
        setFactories(initialFactories)
      }
    }
  }, [currentCompany])

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCompanySubmit = (data: CompanyData) => {
    setCompanyData(data)
    handleNext()
  }

  const handleFactoriesSubmit = (factoryList: FactoryData[]) => {
    setFactories(factoryList)
    handleNext()
  }

  const handleFinalSubmit = async () => {
    if (!currentCompany || !companyData) return

    setIsSubmitting(true)
    try {
      // Prepare updated company data
      const updatedCompany = {
        ...currentCompany,
        ...companyData,
        factories: factories.length > 0 ? factories.map((factory, index) => ({
          id: currentCompany.factories?.[index]?.id || crypto.randomUUID(),
          code: currentCompany.factories?.[index]?.code || `PLANT${String(index + 1).padStart(3, '0')}`,
          ...factory
        })) : currentCompany.factories || []
      }

      // Try to update via API first
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/companies/${currentCompany.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedCompany)
        })

        if (response.ok) {
          const result = await response.json()
          // Update with server response
          if (result.company) {
            const serverUpdatedCompanies = companies.map(c => 
              c.id === currentCompany.id ? result.company : c
            )
            localStorage.setItem('erp-companies', JSON.stringify(serverUpdatedCompanies))
            setCompanies(serverUpdatedCompanies)
            setCurrentCompany(result.company)
            toast.success('Company details updated successfully')
            navigate('/masters/companies')
          }
        } else {
          const errorData = await response.json()
          if (errorData.error?.includes('Admin role required')) {
            toast.error('You need Admin role to update company details')
          } else {
            toast.error(errorData.error || 'Failed to update company details')
          }
        }
      } catch (apiError) {
        console.error('API error:', apiError)
        
        // Update local storage as fallback
        const localUpdatedCompanies = companies.map(c => 
          c.id === currentCompany.id ? updatedCompany : c
        )
        localStorage.setItem('erp-companies', JSON.stringify(localUpdatedCompanies))
        setCompanies(localUpdatedCompanies)
        setCurrentCompany(updatedCompany)
        toast.success('Company details updated locally')
        navigate('/masters/companies')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update company details')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfo
            initialData={companyData}
            onSubmit={handleCompanySubmit}
          />
        )
      case 2:
        return (
          <FactorySetup
            companyName={companyData?.name || ''}
            initialData={factories}
            onSubmit={handleFactoriesSubmit}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Review & Save</h2>
              <p className="mt-2 text-sm text-gray-600">
                Review your changes before saving
              </p>
            </div>

            {/* Company Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-gray-400" />
                Company Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Name:</span> {companyData?.name}</p>
                <p><span className="font-medium">Legal Name:</span> {companyData?.legalName}</p>
                <p><span className="font-medium">GST:</span> {companyData?.gstNumber}</p>
                <p><span className="font-medium">PAN:</span> {companyData?.panNumber}</p>
                {companyData?.tanNumber && <p><span className="font-medium">TAN:</span> {companyData.tanNumber}</p>}
                {companyData?.cinNumber && <p><span className="font-medium">CIN:</span> {companyData.cinNumber}</p>}
                <p><span className="font-medium">Email:</span> {companyData?.email}</p>
                <p><span className="font-medium">Phone:</span> {companyData?.phone}</p>
                <p><span className="font-medium">Address:</span> {companyData?.addressLine1}, {companyData?.city}, {companyData?.state} - {companyData?.pincode}</p>
                <p><span className="font-medium">Financial Year:</span> {companyData?.currentFY}</p>
              </div>
            </div>

            {/* Factories Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Factory className="h-5 w-5 mr-2 text-gray-400" />
                Factories ({factories.length})
              </h3>
              <div className="space-y-3">
                {factories.map((factory, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{factory.name}</p>
                    <p className="text-sm text-gray-600">Type: {factory.type}</p>
                    <p className="text-sm text-gray-600">Location: {factory.city}, {factory.state}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Back to Factories
              </button>
              
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!currentCompany) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No company selected. Please select a company first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-start">
            <div>
              <button
                onClick={() => navigate('/masters/companies')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Companies
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Company Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your company information and factory details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between py-4" aria-label="Progress">
            <ol className="flex items-center space-x-8">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center ${
                      step.id < currentStep
                        ? 'text-primary-600'
                        : step.id === currentStep
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        step.id < currentStep
                          ? 'border-primary-600 bg-primary-600'
                          : step.id === currentStep
                          ? 'border-primary-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <step.icon
                          className={`h-5 w-5 ${
                            step.id === currentStep ? 'text-primary-600' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </span>
                    <span className="ml-3 text-sm font-medium">{step.name}</span>
                  </div>
                  {step.id < steps.length && (
                    <ChevronRight className="ml-8 h-5 w-5 text-gray-400" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}