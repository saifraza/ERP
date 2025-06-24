import { useState } from 'react'
import { BarChart3, Factory, Zap, Droplets, Package2, Bot, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import AIChat from '../components/AIChat'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'react-hot-toast'

const stats = [
  { name: 'Sugar Production', value: '2,450 MT', icon: Factory, color: 'bg-blue-500' },
  { name: 'Power Generation', value: '12.5 MW', icon: Zap, color: 'bg-yellow-500' },
  { name: 'Ethanol Production', value: '45,000 L', icon: Droplets, color: 'bg-green-500' },
  { name: 'Feed Production', value: '890 MT', icon: Package2, color: 'bg-purple-500' },
]

export default function Dashboard() {
  const { token } = useAuthStore()
  const [showAIChat, setShowAIChat] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    divisions: boolean
    factories: boolean
  }>({ divisions: false, factories: false })

  const handleSetupDivisions = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/setup-divisions/create-defaults`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Default divisions created successfully!')
        setSetupStatus(prev => ({ ...prev, divisions: true }))
      } else {
        toast.error(data.error || 'Failed to create divisions')
      }
    } catch (error) {
      toast.error('Failed to create divisions')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSetupFactories = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/setup-divisions/create-default-factories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Default factory created successfully!')
        setSetupStatus(prev => ({ ...prev, factories: true }))
      } else {
        toast.error(data.error || 'Failed to create factory')
      }
    } catch (error) {
      toast.error('Failed to create factory')
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of all divisions</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {item.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">New cane delivery: 145 MT from Farmer #2341</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Sugar batch #789 completed: 125 MT</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Power export to grid: 8.5 MW</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Production Trends
            </h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              Chart placeholder
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup Section */}
      <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Setup
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {setupStatus.divisions ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Business Divisions</p>
                  <p className="text-sm text-gray-600">Sugar, Ethanol, Power, Feed, Common</p>
                </div>
              </div>
              <button
                onClick={handleSetupDivisions}
                disabled={setupLoading || setupStatus.divisions}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  setupStatus.divisions
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {setupStatus.divisions ? 'Created' : 'Create Divisions'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {setupStatus.factories ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Main Factory</p>
                  <p className="text-sm text-gray-600">Integrated factory with all divisions</p>
                </div>
              </div>
              <button
                onClick={handleSetupFactories}
                disabled={setupLoading || setupStatus.factories}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  setupStatus.factories
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {setupStatus.factories ? 'Created' : 'Create Factory'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Button */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors duration-200 z-40"
        title="AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <AIChat onClose={() => setShowAIChat(false)} />
          </div>
        </div>
      )}
    </div>
  )
}