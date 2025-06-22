import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, Activity, Users, Package, 
  DollarSign, ArrowUpRight, ArrowDownRight, MoreVertical,
  Calendar, Filter, Download, Bell, Search, Sun, Moon
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Modern card component with gradient border
const MetricCard = ({ title, value, change, trend, icon: Icon, color, link }: any) => {
  const isPositive = trend === 'up'
  
  return (
    <Link to={link} className="block">
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change}
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          </div>
          <div className={`rounded-2xl p-4 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/20 pointer-events-none" />
      </div>
    </Link>
  )
}

// Modern chart placeholder with skeleton loading effect
const ChartCard = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      {/* Skeleton loader for chart */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-end space-x-2">
            <div className="w-12 text-sm text-gray-400">Label</div>
            <div className="flex-1 bg-gray-100 rounded-lg h-8 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg"
                style={{ width: `${Math.random() * 80 + 20}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Activity item component
const ActivityItem = ({ title, time, type, user }: any) => {
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600'
      case 'warning': return 'bg-yellow-100 text-yellow-600'
      case 'info': return 'bg-blue-100 text-blue-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className={`rounded-full p-2 ${getActivityColor(type)}`}>
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{user} • {time}</p>
      </div>
    </div>
  )
}

export default function DashboardModern() {
  const [darkMode, setDarkMode] = useState(false)
  const [timeRange, setTimeRange] = useState('month')

  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹24.5L',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      link: '/finance'
    },
    {
      title: 'Active Orders',
      value: '156',
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      link: '/store/orders'
    },
    {
      title: 'Pending Invoices',
      value: '23',
      change: '-15.3%',
      trend: 'down',
      icon: Activity,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      link: '/finance/invoices'
    },
    {
      title: 'Active Vendors',
      value: '89',
      change: '+5.1%',
      trend: 'up',
      icon: Users,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      link: '/finance/vendors'
    }
  ]

  const recentActivities = [
    { title: 'New purchase order PO-2024-001 created', time: '2 mins ago', type: 'success', user: 'John Doe' },
    { title: 'Invoice INV-2024-045 pending approval', time: '15 mins ago', type: 'warning', user: 'Jane Smith' },
    { title: 'Material requisition MR-2024-089 approved', time: '1 hour ago', type: 'info', user: 'Mike Johnson' },
    { title: 'Payment of ₹50,000 processed to vendor', time: '2 hours ago', type: 'success', user: 'Sarah Wilson' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-gray-600" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <ChartCard 
              title="Revenue Overview" 
              subtitle="Monthly revenue breakdown by division"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Top Products" />
              <ChartCard title="Vendor Performance" />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Link to="/activity" className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/store/requisition/new" className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <span className="text-sm font-medium">Create Requisition</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/finance/invoice/new" className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <span className="text-sm font-medium">New Invoice</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/reports" className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <span className="text-sm font-medium">Generate Reports</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}