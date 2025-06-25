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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 ${item.color} rounded p-2`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {item.name}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Activities
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">New cane delivery: 145 MT from Farmer #2341</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Sugar batch #789 completed: 125 MT</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Power export to grid: 8.5 MW</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Production Trends
            </h3>
            <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-600">
              Chart placeholder
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup Section */}
      <div className="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Settings className="h-4 w-4 mr-1.5" />
              Quick Setup
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="flex items-center gap-2">
                {setupStatus.divisions ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Business Divisions</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sugar, Ethanol, Power, Feed, Common</p>
                </div>
              </div>
              <button
                onClick={handleSetupDivisions}
                disabled={setupLoading || setupStatus.divisions}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                  setupStatus.divisions
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {setupStatus.divisions ? 'Created' : 'Create Divisions'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="flex items-center gap-2">
                {setupStatus.factories ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Main Factory</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Integrated factory with all divisions</p>
                </div>
              </div>
              <button
                onClick={handleSetupFactories}
                disabled={setupLoading || setupStatus.factories}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                  setupStatus.factories
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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