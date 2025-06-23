import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, Activity, Users, Package, 
  IndianRupee, Factory, Zap, Beaker, Wheat, Calendar,
  AlertCircle, CheckCircle, Clock, ArrowRight, BarChart3,
  Eye, Download, RefreshCw, Filter, MoreVertical,
  Sparkles, Bot, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

// Mock data for the dashboard
const stats = [
  {
    title: 'Daily Crushing',
    value: '12,450',
    unit: 'MT',
    change: '+12.5%',
    trend: 'up',
    icon: Factory,
    color: 'blue',
    href: '/sugar/crushing'
  },
  {
    title: 'Power Generation',
    value: '28.5',
    unit: 'MW',
    change: '+5.2%',
    trend: 'up',
    icon: Zap,
    color: 'yellow',
    href: '/power/generation'
  },
  {
    title: 'Ethanol Production',
    value: '45,230',
    unit: 'Liters',
    change: '-2.3%',
    trend: 'down',
    icon: Beaker,
    color: 'purple',
    href: '/ethanol/production'
  },
  {
    title: 'Revenue Today',
    value: '₹2.45',
    unit: 'Cr',
    change: '+18.7%',
    trend: 'up',
    icon: IndianRupee,
    color: 'green',
    href: '/finance/dashboard'
  }
]

const alerts = [
  { id: 1, type: 'warning', message: 'Low molasses stock in Tank B-3', time: '2 hours ago', division: 'Ethanol' },
  { id: 2, type: 'error', message: 'Boiler #2 maintenance overdue', time: '4 hours ago', division: 'Power' },
  { id: 3, type: 'success', message: 'Sugar packing target achieved', time: '5 hours ago', division: 'Sugar' },
  { id: 4, type: 'info', message: 'New purchase order approved', time: '6 hours ago', division: 'Procurement' },
]

const productionData = [
  { time: '6 AM', sugar: 120, power: 25, ethanol: 3500 },
  { time: '9 AM', sugar: 185, power: 28, ethanol: 4200 },
  { time: '12 PM', sugar: 220, power: 30, ethanol: 4800 },
  { time: '3 PM', sugar: 195, power: 29, ethanol: 4500 },
  { time: '6 PM', sugar: 180, power: 27, ethanol: 4100 },
  { time: '9 PM', sugar: 160, power: 26, ethanol: 3800 },
]

const quickActions = [
  { name: 'New Purchase Order', icon: Package, href: '/store/purchase-orders/new', color: 'indigo' },
  { name: 'Farmer Payment', icon: Users, href: '/farmers/payments/new', color: 'green' },
  { name: 'Quality Report', icon: CheckCircle, href: '/sugar/lab/new-report', color: 'purple' },
  { name: 'Maintenance Request', icon: AlertCircle, href: '/maintenance/new-request', color: 'orange' },
]

export default function DashboardUltra() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [showAIInsights, setShowAIInsights] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enterprise Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time overview of all factory operations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Download className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* AI Insights Banner */}
      {showAIInsights && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <button
              onClick={() => setShowAIInsights(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">AI Insights Available</h3>
              <p className="text-white/90 mb-4">
                Your AI assistant has identified 3 optimization opportunities that could save ₹12.5 lakhs this month.
              </p>
              <Link
                to="/mails"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                View AI Recommendations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.trend === 'up'
          
          return (
            <Link
              key={stat.title}
              to={stat.href}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-lg",
                  stat.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30",
                  stat.color === 'yellow' && "bg-yellow-100 dark:bg-yellow-900/30",
                  stat.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30",
                  stat.color === 'green' && "bg-green-100 dark:bg-green-900/30"
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    stat.color === 'blue' && "text-blue-600 dark:text-blue-400",
                    stat.color === 'yellow' && "text-yellow-600 dark:text-yellow-400",
                    stat.color === 'purple' && "text-purple-600 dark:text-purple-400",
                    stat.color === 'green' && "text-green-600 dark:text-green-400"
                  )} />
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.unit}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isPositive 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    vs yesterday
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Production Overview
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Sugar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Power</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Ethanol</span>
              </div>
            </div>
          </div>
          
          {/* Simplified chart visualization */}
          <div className="h-64 flex items-end justify-between gap-2">
            {productionData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(data.sugar / 250) * 100}px` }}
                  />
                  <div 
                    className="w-full bg-yellow-500"
                    style={{ height: `${(data.power / 35) * 100}px` }}
                  />
                  <div 
                    className="w-full bg-purple-500 rounded-b"
                    style={{ height: `${(data.ethanol / 5000) * 100}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {data.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Alerts
            </h2>
            <Link
              to="/alerts"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  alert.type === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30",
                  alert.type === 'error' && "bg-red-100 dark:bg-red-900/30",
                  alert.type === 'success' && "bg-green-100 dark:bg-green-900/30",
                  alert.type === 'info' && "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {alert.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                  {alert.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{alert.division}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{alert.time}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.name}
                to={action.href}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={cn(
                  "p-3 rounded-lg",
                  action.color === 'indigo' && "bg-indigo-100 dark:bg-indigo-900/30",
                  action.color === 'green' && "bg-green-100 dark:bg-green-900/30",
                  action.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30",
                  action.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30"
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    action.color === 'indigo' && "text-indigo-600 dark:text-indigo-400",
                    action.color === 'green' && "text-green-600 dark:text-green-400",
                    action.color === 'purple' && "text-purple-600 dark:text-purple-400",
                    action.color === 'orange' && "text-orange-600 dark:text-orange-400"
                  )} />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                  {action.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Add missing X import
const X = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)