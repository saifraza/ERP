import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Factory, Database, CheckCircle, ChevronRight, ChevronLeft, Mail } from 'lucide-react'
import { useCompanyStore } from '../../stores/companyStore'
import CompanyInfo from './CompanyInfo'
import FactorySetup from './FactorySetup'
import MasterDataSetup from './MasterDataSetup'
import EmailSetup from './EmailSetup'
import SetupComplete from './SetupComplete'

const steps = [
  { id: 1, name: 'Email Setup', icon: Mail },
  { id: 2, name: 'Company Information', icon: Building },
  { id: 3, name: 'Factory Setup', icon: Factory },
  { id: 4, name: 'Master Data', icon: Database },
  { id: 5, name: 'Complete', icon: CheckCircle },
]

export interface CompanyData {
  name: string
  legalName: string
  gstNumber: string
  panNumber: string
  tanNumber?: string
  cinNumber?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  email: string
  phone: string
  website?: string
  fyStartMonth: number
  currentFY: string
  logo?: string | File | FileList
  letterhead?: string | File | FileList
}

export interface FactoryData {
  name: string
  type: 'sugar' | 'ethanol' | 'integrated' | 'feed'
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  crushingCapacity?: number
  powerCapacity?: number
  ethanolCapacity?: number
  feedCapacity?: number
  gstNumber?: string
  factoryLicense?: string
  pollutionLicense?: string
}

export default function CompanySetup() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [factories, setFactories] = useState<FactoryData[]>([])
  const [masterDataTemplate, setMasterDataTemplate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleMasterDataSubmit = (template: string) => {
    console.log('Master data template selected:', template)
    setMasterDataTemplate(template)
    // Call submitSetup with the template directly to ensure it's not lost
    submitSetupWithTemplate(template)
  }
  
  const submitSetupWithTemplate = async (template: string) => {
    setIsSubmitting(true)
    try {
      console.log('Starting setup submission...')
      console.log('Company Data:', companyData)
      console.log('Factories:', factories)
      console.log('Master Data Template:', template)
      
      // Validate required data
      if (!companyData) {
        throw new Error('Company data is missing')
      }
      if (!factories || factories.length === 0) {
        throw new Error('At least one factory is required')
      }
      
      // For development, save to localStorage
      const companyId = crypto.randomUUID()
      const company = {
        id: companyId,
        code: `COMP${Date.now().toString().slice(-6)}`,
        ...companyData,
        masterDataTemplate: template,
        factories: factories.map((factory, index) => ({
          id: crypto.randomUUID(),
          code: `PLANT${String(index + 1).padStart(3, '0')}`,
          ...factory
        }))
      }
      
      console.log('Prepared company object:', company)
      
      // Save to localStorage
      const existingCompanies = JSON.parse(localStorage.getItem('erp-companies') || '[]')
      existingCompanies.push(company)
      localStorage.setItem('erp-companies', JSON.stringify(existingCompanies))
      console.log('Saved to localStorage successfully')
      
      // Update the store immediately
      const { setCompanies, setCurrentCompany } = useCompanyStore.getState()
      setCompanies(existingCompanies)
      setCurrentCompany(company)
      console.log('Updated store successfully')
      
      // Also try API call but don't fail if it doesn't work
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const requestBody = {
          company: companyData,
          factories: factories,
          masterDataTemplate: template
        }
        console.log('Sending setup request:', requestBody)
        
        const response = await fetch(`${apiUrl}/api/setup-company/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(requestBody)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Setup API error:', errorData)
          
          // Show the validation details if available
          if (errorData.details && Array.isArray(errorData.details)) {
            console.error('Validation errors:', errorData.details)
            errorData.details.forEach((err: any, index: number) => {
              console.error(`Error ${index + 1}:`, err)
            })
          }
          
          // For now, let's throw the error to see it clearly
          throw new Error(`Setup failed: ${errorData.error || 'Unknown error'}`)
        }
      } catch (apiError) {
        console.warn('API not available, using local storage:', apiError)
      }
      
      handleNext() // Go to complete step
    } catch (error) {
      console.error('Setup error details:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to complete setup: ${errorMessage}\n\nCheck console for details.`)
    } finally {
      setIsSubmitting(false)
    }
  }


  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EmailSetup
            onNext={handleNext}
            isFirstStep={true}
          />
        )
      case 2:
        return (
          <CompanyInfo
            initialData={companyData}
            onSubmit={handleCompanySubmit}
          />
        )
      case 3:
        return (
          <FactorySetup
            companyName={companyData?.name || ''}
            initialData={factories}
            onSubmit={handleFactoriesSubmit}
            onBack={handleBack}
          />
        )
      case 4:
        return (
          <MasterDataSetup
            industryType={factories[0]?.type || 'integrated'}
            onSubmit={handleMasterDataSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )
      case 5:
        return (
          <SetupComplete
            companyName={companyData?.name || ''}
            factoryCount={factories.length}
            onComplete={() => {
              // Navigate directly - the store should already be updated
              navigate('/')
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Setup Wizard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Complete the setup to start using your ERP system
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