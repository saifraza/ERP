import { CheckCircle, ArrowRight, Building, Factory, Users, FileText } from 'lucide-react'

interface SetupCompleteProps {
  companyName: string
  factoryCount: number
  onComplete: () => void
}

export default function SetupComplete({ companyName, factoryCount, onComplete }: SetupCompleteProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-600 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-lg">✓</span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup Complete! 🎉</h2>
      <p className="text-lg text-gray-600 mb-8">
        Your ERP system is ready to use. Let's get started!
      </p>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What we've set up for you:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-3">
            <Building className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{companyName}</p>
              <p className="text-sm text-gray-600">Company registered with GST & PAN</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Factory className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{factoryCount} {factoryCount === 1 ? 'Factory' : 'Factories'}</p>
              <p className="text-sm text-gray-600">Production units configured</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Chart of Accounts</p>
              <p className="text-sm text-gray-600">Industry-specific GL accounts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Master Data</p>
              <p className="text-sm text-gray-600">Tax rates, HSN codes, workflows</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommended Next Steps:</h3>
        <ol className="text-left space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-medium mr-2">1.</span>
            <span>Add your team members and assign roles in Settings → Users</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">2.</span>
            <span>Import or create your vendor and customer masters</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">3.</span>
            <span>Configure your opening balances in Finance → Opening Balance</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">4.</span>
            <span>Start with your first transaction - create a purchase requisition</span>
          </li>
        </ol>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <a
          href="https://docs.example.com/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all"
        >
          <FileText className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Documentation</p>
          <p className="text-xs text-gray-600 mt-1">Learn how to use the system</p>
        </a>
        
        <a
          href="https://www.youtube.com/watch?v=demo"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all"
        >
          <svg className="h-8 w-8 text-red-600 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          <p className="text-sm font-medium text-gray-900">Video Tutorials</p>
          <p className="text-xs text-gray-600 mt-1">Watch step-by-step guides</p>
        </a>
        
        <a
          href="mailto:support@example.com"
          className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all"
        >
          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Support</p>
          <p className="text-xs text-gray-600 mt-1">Get help from our team</p>
        </a>
      </div>

      {/* CTA Button */}
      <button
        onClick={onComplete}
        className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-medium text-lg rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        Enter Your ERP System
        <ArrowRight className="ml-3 h-6 w-6" />
      </button>

      {/* Footer Note */}
      <p className="mt-8 text-sm text-gray-500">
        You can always modify your settings and add more factories later from the Masters section.
      </p>
    </div>
  )
}