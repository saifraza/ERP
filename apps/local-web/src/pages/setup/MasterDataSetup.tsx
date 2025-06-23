import { useState } from 'react'
import { Database, FileText, Calculator, Users, ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface MasterDataSetupProps {
  industryType: string
  onSubmit: (template: string) => void
  onBack: () => void
  isSubmitting: boolean
}

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  features: string[]
  recommended?: boolean
}

const templates: Template[] = [
  {
    id: 'sugar_standard',
    name: 'Sugar Industry Standard',
    description: 'Pre-configured for sugar mills with cane procurement, sugar production, and by-products',
    icon: <FileText className="h-8 w-8 text-primary-600" />,
    features: [
      'Chart of accounts for sugar industry',
      'GST rates for sugar products',
      'Standard material categories',
      'Farmer payment workflows',
      'Cane pricing formulas'
    ],
    recommended: true
  },
  {
    id: 'ethanol_focused',
    name: 'Ethanol Plant Template',
    description: 'Optimized for distilleries with molasses processing and ethanol production',
    icon: <Calculator className="h-8 w-8 text-green-600" />,
    features: [
      'Ethanol-specific accounts',
      'Excise duty configuration',
      'Molasses tracking',
      'B-Heavy/C-Heavy pricing',
      'OMC customer setup'
    ]
  },
  {
    id: 'integrated_unit',
    name: 'Integrated Complex',
    description: 'Complete setup for sugar, ethanol, power, and feed operations',
    icon: <Database className="h-8 w-8 text-purple-600" />,
    features: [
      'Multi-division accounting',
      'Inter-unit transfers',
      'Power trading accounts',
      'Feed production setup',
      'Consolidated reporting'
    ]
  },
  {
    id: 'minimal',
    name: 'Minimal Setup',
    description: 'Basic configuration that you can customize later',
    icon: <Users className="h-8 w-8 text-gray-600" />,
    features: [
      'Basic chart of accounts',
      'Standard GST rates',
      'Essential masters only',
      'Default workflows',
      'Manual configuration'
    ]
  }
]

export default function MasterDataSetup({ industryType, onSubmit, onBack, isSubmitting }: MasterDataSetupProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    industryType === 'sugar' ? 'sugar_standard' : 
    industryType === 'ethanol' ? 'ethanol_focused' : 
    'integrated_unit'
  )

  const handleSubmit = () => {
    onSubmit(selectedTemplate)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Master Data Setup</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose a template to quickly set up your chart of accounts, tax rates, and workflows
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {template.recommended && (
                <div className="absolute -top-3 -right-3 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">{template.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedTemplate === template.id && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>We'll create your chart of accounts based on the selected template</li>
                  <li>Set up standard tax rates and HSN codes for your industry</li>
                  <li>Configure approval workflows and user roles</li>
                  <li>You can customize everything later in the Masters section</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Data Preview */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What will be created:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Chart of Accounts</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Assets (Current & Fixed)</li>
                <li>• Liabilities</li>
                <li>• Income accounts</li>
                <li>• Expense accounts</li>
                <li>• Capital accounts</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tax Configuration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GST rates (5%, 12%, 18%)</li>
                <li>• HSN codes for products</li>
                <li>• TDS sections</li>
                <li>• SAC codes for services</li>
                <li>• State codes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Masters</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Material categories</li>
                <li>• Units of measure</li>
                <li>• Payment terms</li>
                <li>• Approval matrix</li>
                <li>• Number series</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating your ERP...
            </>
          ) : (
            <>
              Complete Setup
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}