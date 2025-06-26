import { useState, Fragment, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import {
  Home, Package, DollarSign, Users, FileText, Settings,
  Menu, X, LogOut, Bell, Search, ChevronRight, Layers,
  Mail, Building2, Truck, Factory, Zap, Beaker, Wheat,
  TrendingUp, ShoppingBag, ClipboardList, Calculator,
  BarChart3, Shield, UserCheck, Database, Globe,
  Moon, Sun, Command, User, HelpCircle, ChevronDown,
  Activity, AlertCircle, CheckCircle, Clock, Filter,
  Grid3X3, List, Calendar, Sparkles, CreditCard,
  FileCheck, Wallet, Receipt, Landmark, IndianRupee,
  ScrollText, UserPlus, Package2, Scale, BookOpen
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'
import CompanySelector from '../components/CompanySelector'
import CommandPalette from '../components/CommandPalette'
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp'
// import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts' // Removed shortcuts system
import DensityToggle from '../components/DensityToggle'

interface UltraModernLayoutProps {
  children: React.ReactNode
}

// Enhanced navigation structure with all divisions and modules
const navigation = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Email & AI', href: '/mails', icon: Sparkles, badge: 'NEW', badgeColor: 'green' },
      { name: 'Email Automation', href: '/email-automation', icon: Mail, badge: 'AUTO', badgeColor: 'green' },
      { name: 'Gmail Test', href: '/gmail-test', icon: Mail, badge: 'TEST' },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Storage', href: '/storage', icon: Database },
    ]
  },
  {
    title: 'Operations',
    items: [
      {
        name: 'Sugar Division',
        icon: Factory,
        children: [
          { name: 'Cane Yard', href: '/sugar/cane-yard', icon: Truck },
          { name: 'Weighbridge', href: '/sugar/weighbridge', icon: Scale },
          { name: 'Crushing', href: '/sugar/crushing', icon: Factory },
          { name: 'Processing', href: '/sugar/processing', icon: Activity },
          { name: 'Quality Lab', href: '/sugar/lab', icon: Beaker },
          { name: 'Packing', href: '/sugar/packing', icon: Package2 },
        ]
      },
      {
        name: 'Power Division',
        icon: Zap,
        children: [
          { name: 'Generation', href: '/power/generation', icon: Activity },
          { name: 'Boilers', href: '/power/boilers', icon: Factory },
          { name: 'Turbines', href: '/power/turbines', icon: Zap },
          { name: 'Grid Export', href: '/power/grid', icon: Globe },
          { name: 'Maintenance', href: '/power/maintenance', icon: Settings },
        ]
      },
      {
        name: 'Ethanol Division',
        icon: Beaker,
        children: [
          { name: 'Fermentation', href: '/ethanol/fermentation', icon: Beaker },
          { name: 'Distillation', href: '/ethanol/distillation', icon: Factory },
          { name: 'Storage Tanks', href: '/ethanol/storage', icon: Database },
          { name: 'Quality Control', href: '/ethanol/quality', icon: FileCheck },
          { name: 'Dispatch', href: '/ethanol/dispatch', icon: Truck },
        ]
      },
      {
        name: 'Feed Division',
        icon: Wheat,
        children: [
          { name: 'Raw Materials', href: '/feed/materials', icon: Package },
          { name: 'Formulation', href: '/feed/formulation', icon: ClipboardList },
          { name: 'Production', href: '/feed/production', icon: Factory },
          { name: 'Packaging', href: '/feed/packaging', icon: Package2 },
        ]
      }
    ]
  },
  {
    title: 'Supply Chain',
    items: [
      {
        name: 'Procurement',
        icon: ShoppingBag,
        href: '/procurement',
        children: [
          { name: 'Vendor Management', href: '/procurement/vendors', icon: Users, badge: 'NEW', badgeColor: 'green' },
          { name: 'Purchase Requisitions', href: '/procurement/requisitions', icon: ClipboardList, badge: 'NEW', badgeColor: 'green' },
          { name: 'Pending Approvals', href: '/procurement/approvals', icon: Shield, badge: 'MGR', badgeColor: 'yellow' },
          { name: 'RFQ Management', href: '/procurement/rfqs', icon: Calculator, badge: 'NEW', badgeColor: 'green' },
          { name: 'Purchase Orders', href: '/procurement/purchase-orders', icon: FileText },
          { name: 'Quotation Comparison', href: '/procurement/quotations', icon: BarChart3 },
          { name: 'Goods Receipt', href: '/procurement/grn', icon: Package },
          { name: 'Vendor Invoices', href: '/procurement/invoices', icon: Receipt },
          { name: 'Vendor Payments', href: '/procurement/payments', icon: IndianRupee },
        ]
      },
      {
        name: 'Inventory',
        icon: Package,
        children: [
          { name: 'Stock Overview', href: '/store/inventory', icon: Package },
          { name: 'Stock Transfer', href: '/store/transfers', icon: Truck },
          { name: 'Stock Adjustment', href: '/store/adjustments', icon: Settings },
          { name: 'Min-Max Levels', href: '/store/reorder', icon: BarChart3 },
        ]
      }
    ]
  },
  {
    title: 'Finance',
    items: [
      {
        name: 'Accounts Payable',
        icon: CreditCard,
        children: [
          { name: 'Vendor Invoices', href: '/finance/invoices', icon: FileText },
          { name: 'Payments', href: '/finance/payments', icon: IndianRupee },
          { name: 'Advance Payments', href: '/finance/advances', icon: Wallet },
          { name: 'TDS Management', href: '/finance/tds', icon: Receipt },
        ]
      },
      {
        name: 'Accounts Receivable',
        icon: IndianRupee,
        children: [
          { name: 'Customer Invoices', href: '/finance/sales-invoices', icon: FileText },
          { name: 'Receipts', href: '/finance/receipts', icon: Receipt },
          { name: 'Credit Control', href: '/finance/credit', icon: Shield },
        ]
      },
      {
        name: 'Banking',
        icon: Landmark,
        children: [
          { name: 'Bank Accounts', href: '/finance/banking', icon: Landmark },
          { name: 'Reconciliation', href: '/finance/reconciliation', icon: FileCheck },
          { name: 'Cash Management', href: '/finance/cash', icon: Wallet },
        ]
      },
      {
        name: 'Compliance',
        icon: Shield,
        children: [
          { name: 'GST Returns', href: '/finance/gst', icon: ScrollText },
          { name: 'TDS Returns', href: '/finance/tds-returns', icon: FileText },
          { name: 'Audit Trail', href: '/finance/audit', icon: Shield },
        ]
      }
    ]
  },
  {
    title: 'Human Resources',
    items: [
      {
        name: 'Employee Management',
        icon: Users,
        children: [
          { name: 'Employee List', href: '/hr/employees', icon: Users },
          { name: 'Attendance', href: '/hr/attendance', icon: Calendar },
          { name: 'Leave Management', href: '/hr/leaves', icon: Calendar },
          { name: 'Payroll', href: '/hr/payroll', icon: IndianRupee },
        ]
      },
      {
        name: 'Farmer Management',
        icon: UserPlus,
        children: [
          { name: 'Farmer Registry', href: '/farmers/list', icon: Users },
          { name: 'Field Mapping', href: '/farmers/fields', icon: Globe },
          { name: 'Cane Contracts', href: '/farmers/contracts', icon: FileText },
          { name: 'Payment History', href: '/farmers/payments', icon: IndianRupee },
        ]
      }
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Production Reports', href: '/reports/production', icon: BarChart3 },
      { name: 'Financial Reports', href: '/reports/financial', icon: TrendingUp },
      { name: 'Inventory Reports', href: '/reports/inventory', icon: Package },
      { name: 'Custom Reports', href: '/reports/custom', icon: FileText },
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        name: 'Master Data',
        icon: Database,
        children: [
          { name: 'Companies', href: '/masters/companies', icon: Building2 },
          { name: 'Divisions', href: '/masters/divisions', icon: Building2 },
          { name: 'Departments', href: '/masters/departments', icon: Users },
          { name: 'Materials', href: '/masters/materials', icon: Package },
          { name: 'Vendors', href: '/masters/vendors', icon: Users },
          { name: 'Customers', href: '/masters/customers', icon: UserCheck },
          { name: 'Chart of Accounts', href: '/masters/accounts', icon: BookOpen },
          { name: 'Cost Centers', href: '/masters/cost-centers', icon: Calculator },
        ]
      },
      {
        name: 'Settings',
        icon: Settings,
        children: [
          { name: 'General Settings', href: '/settings', icon: Settings },
          { name: 'Email Integration', href: '/settings/email', icon: Mail },
          { name: 'User Management', href: '/settings/users', icon: Users },
          { name: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
          { name: 'Backup & Restore', href: '/settings/backup', icon: Database },
        ]
      }
    ]
  }
]

export default function UltraModernLayout({ children }: UltraModernLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { user, logout } = useAuthStore()
  
  // Initialize global keyboard shortcuts
  // useGlobalKeyboardShortcuts() // Removed shortcuts system

  // Auto-expand active sections
  useEffect(() => {
    const path = location.pathname
    const activeSection = navigation.flatMap(section => 
      section.items.filter((item: any) => 
        item.children?.some((child: any) => child.href === path)
      )
    )
    if (activeSection.length > 0) {
      setExpandedSections(prev => [...new Set([...prev, activeSection[0].name])])
    }
  }, [location.pathname])

  const toggleSection = (name: string) => {
    setExpandedSections(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <div className={cn("h-screen flex overflow-hidden", darkMode ? "dark" : "")}>
      <div className="flex flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                  <SidebarContent
                    navigation={navigation}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    isActive={isActive}
                    user={user}
                    logout={logout}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-80 lg:flex-col">
          <SidebarContent
            navigation={navigation}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            isActive={isActive}
            user={user}
            logout={logout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />
        </div>

        {/* Main content */}
        <div className="lg:pl-80 flex flex-col flex-1">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-200"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </button>
                
                {/* Breadcrumb */}
                <nav className="hidden lg:flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link to="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <Home className="h-4 w-4" />
                      </Link>
                    </li>
                    {location.pathname !== '/' && (
                      <>
                        <li>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </li>
                        <li>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {location.pathname.split('/').filter(Boolean).join(' / ')}
                          </span>
                        </li>
                      </>
                    )}
                  </ol>
                </nav>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Global search */}
                <button
                  onClick={() => setShowSearch(true)}
                  data-search-trigger
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                <form onSubmit={handleSearch} className="hidden lg:block relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search... (⌘K)"
                    data-search-trigger
                    className="pl-10 pr-3 py-2 w-64 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </form>

                {/* Notifications */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                </button>

                {/* Density toggle */}
                <DensityToggle />

                {/* Theme toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>

                {/* Help */}
                <button 
                  onClick={() => {
                    const event = new CustomEvent('show-keyboard-help')
                    window.dispatchEvent(event)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Keyboard shortcuts (?)"
                >
                  <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* User menu */}
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scrollbar-thin">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Command palette / Search modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-gray-900/50" onClick={() => setShowSearch(false)}>
          <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
              <input
                type="text"
                placeholder="Search pages, documents, or commands..."
                className="w-full px-4 py-3 text-lg bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Command Palette */}
      <CommandPalette />
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  )
}

// Sidebar component
function SidebarContent({ 
  navigation, 
  expandedSections, 
  toggleSection, 
  isActive,
  user,
  logout,
  searchQuery,
  setSearchQuery,
  handleSearch
}: any) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Factory className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">MSPIL ERP</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enterprise Edition</p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <CompanySelector />
      </div>

      {/* Search */}
      <div className="px-6 py-4 lg:hidden">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 pr-3 py-2 w-full bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-scroll px-4 py-4 scrollbar-always">
        {navigation.map((section: any) => (
          <div key={section.title} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <ul role="list" className="space-y-1">
              {section.items.map((item: any) => (
                <li key={item.name}>
                  {!item.children ? (
                    <Link
                      to={item.href}
                      className={cn(
                        isActive(item.href)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                        'group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive(item.href) 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-gray-400 dark:text-gray-500',
                          'h-5 w-5 shrink-0'
                        )}
                      />
                      {item.name}
                      {item.badge && (
                        <span className={cn(
                          "ml-auto text-xs px-2 py-0.5 rounded-full",
                          item.badgeColor === 'green' 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div>
                      {item.href ? (
                        <Link
                          to={item.href}
                          onClick={() => toggleSection(item.name)}
                          className={cn(
                            isActive(item.href) || item.children.some((child: any) => isActive(child.href))
                              ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive(item.href) || item.children.some((child: any) => isActive(child.href))
                                ? 'text-gray-700 dark:text-gray-200' 
                                : 'text-gray-400 dark:text-gray-500',
                              'h-5 w-5 shrink-0'
                            )}
                          />
                          {item.name}
                          <ChevronRight
                            className={cn(
                              'ml-auto h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform',
                              expandedSections.includes(item.name) && 'rotate-90'
                            )}
                          />
                        </Link>
                      ) : (
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={cn(
                            item.children.some((child: any) => isActive(child.href))
                              ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all'
                          )}
                        >
                        <item.icon
                          className={cn(
                            item.children.some((child: any) => isActive(child.href))
                              ? 'text-gray-700 dark:text-gray-200' 
                              : 'text-gray-400 dark:text-gray-500',
                            'h-5 w-5 shrink-0'
                          )}
                        />
                          {item.name}
                          <ChevronRight
                            className={cn(
                              'ml-auto h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform',
                              expandedSections.includes(item.name) && 'rotate-90'
                            )}
                          />
                        </button>
                      )}
                      {expandedSections.includes(item.name) && (
                        <ul className="mt-1 px-2 space-y-1">
                          {item.children.map((subItem: any) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.href}
                                className={cn(
                                  isActive(subItem.href)
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                                  'group flex items-center gap-x-3 rounded-lg py-2 pl-11 pr-3 text-sm transition-all'
                                )}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4 shrink-0" />
                                )}
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <button className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}