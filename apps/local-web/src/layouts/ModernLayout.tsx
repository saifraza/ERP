import { useState, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import {
  Home, Package, DollarSign, Users, FileText, Settings,
  ChevronDown, Menu, X, LogOut, Bell, Search, 
  ShoppingCart, Warehouse, CreditCard, BarChart3,
  Building, ChevronRight, Layers, Grid
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'
import CompanySelector from '../components/CompanySelector'

interface ModernLayoutProps {
  children: React.ReactNode
}

// Navigation structure with nested items
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documents', href: '/documents', icon: FileText },
  {
    name: 'Store',
    icon: Warehouse,
    children: [
      { name: 'Requisitions', href: '/store/requisitions' },
      { name: 'Purchase Orders', href: '/store/purchase-orders' },
      { name: 'Goods Receipt', href: '/store/goods-receipt' },
      { name: 'Inventory', href: '/store/inventory' },
      { name: 'Stock Transfer', href: '/store/transfers' },
    ]
  },
  {
    name: 'Finance',
    icon: DollarSign,
    children: [
      { name: 'Invoices', href: '/finance/invoices' },
      { name: 'Payments', href: '/finance/payments' },
      { name: 'Receipts', href: '/finance/receipts' },
      { name: 'Banking', href: '/finance/banking' },
      { name: 'GST Returns', href: '/finance/gst' },
    ]
  },
  {
    name: 'Masters',
    icon: Grid,
    children: [
      { name: 'Companies', href: '/masters/companies' },
      { name: 'Materials', href: '/masters/materials' },
      { name: 'Vendors', href: '/masters/vendors' },
      { name: 'Customers', href: '/masters/customers' },
      { name: 'Chart of Accounts', href: '/masters/accounts' },
    ]
  },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function ModernLayout({ children }: ModernLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Store', 'Finance'])
  const { user, logout } = useAuthStore()

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isParentActive = (children: any[]) => {
    return children.some(child => isActive(child.href))
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
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
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent
                  navigation={navigation}
                  expandedItems={expandedItems}
                  toggleExpanded={toggleExpanded}
                  isActive={isActive}
                  isParentActive={isParentActive}
                  user={user}
                  logout={logout}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent
          navigation={navigation}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
          isActive={isActive}
          isParentActive={isParentActive}
          user={user}
          logout={logout}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 lg:hidden bg-white border-b border-gray-200">
          <div className="flex h-16 items-center gap-x-4 px-4">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 items-center justify-end gap-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Sidebar component
function SidebarContent({ 
  navigation, 
  expandedItems, 
  toggleExpanded, 
  isActive, 
  isParentActive,
  user,
  logout 
}: any) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Factory ERP</h2>
            <p className="text-xs text-gray-500">Multi-Factory Edition</p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="px-6">
        <CompanySelector />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item: any) => (
            <li key={item.name}>
              {!item.children ? (
                <Link
                  to={item.href}
                  className={cn(
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50',
                    'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive(item.href) ? 'text-primary-600' : 'text-gray-400',
                      'h-5 w-5 shrink-0'
                    )}
                  />
                  {item.name}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      isParentActive(item.children)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50',
                      'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isParentActive(item.children) ? 'text-primary-600' : 'text-gray-400',
                        'h-5 w-5 shrink-0'
                      )}
                    />
                    {item.name}
                    <ChevronRight
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform',
                        expandedItems.includes(item.name) && 'rotate-90'
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.name) && (
                    <ul className="mt-1 px-2">
                      {item.children.map((subItem: any) => (
                        <li key={subItem.name}>
                          <Link
                            to={subItem.href}
                            className={cn(
                              isActive(subItem.href)
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-600 hover:bg-gray-50',
                              'group flex items-center gap-x-3 rounded-lg py-2 pl-9 pr-3 text-sm transition-colors'
                            )}
                          >
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
      </nav>

      {/* User menu */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center gap-x-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}