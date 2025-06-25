import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import ModernLayout from './layouts/ModernLayout'
import UltraModernLayout from './layouts/UltraModernLayout'
import Dashboard from './pages/Dashboard'
import DashboardModern from './pages/DashboardModern'
import DashboardUltra from './pages/DashboardUltra'
import Login from './pages/Login'
import Documents from './pages/Documents'
import Storage from './pages/Storage'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import Vendors from './pages/finance/Vendors'
import VendorsModern from './pages/finance/VendorsModern'
import CompanySetup from './pages/setup/CompanySetup'
import Companies from './pages/masters/Companies'
import CompanyEdit from './pages/masters/CompanyEdit'
import Divisions from './pages/masters/Divisions'
import Departments from './pages/masters/Departments'
import VendorMaster from './pages/masters/VendorMaster'
import MaterialMaster from './pages/masters/MaterialMaster'
import Mails from './pages/Mails'
import EmailSettings from './pages/settings/EmailSettings'
import GmailTest from './pages/GmailTest'
import EmailAutomation from './pages/EmailAutomation'
import VendorsProcurement from './pages/procurement/Vendors'
import VendorDetail from './pages/procurement/VendorDetail'
import PurchaseRequisitions from './pages/procurement/PurchaseRequisitions'
import PurchaseRequisitionDetail from './pages/procurement/PurchaseRequisitionDetail'
import RFQManagement from './pages/procurement/RFQManagement'
import ProcurementDashboard from './pages/procurement/ProcurementDashboard'
import { useAuthStore } from './stores/authStore'
import { useCompanyStore } from './stores/companyStore'

const queryClient = new QueryClient()

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { isSetupComplete, checkSetupStatus, isLoading, companies } = useCompanyStore()
  
  // Use ultra-modern UI by default - can be toggled via settings
  const useUltraModernUI = true
  const useModernUI = false

  const Layout = useUltraModernUI ? UltraModernLayout : (useModernUI ? ModernLayout : MainLayout)
  const DashboardPage = useUltraModernUI ? DashboardUltra : (useModernUI ? DashboardModern : Dashboard)
  const VendorsPage = useModernUI ? VendorsModern : Vendors

  // Check company setup status when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Force clear any stale state and reload
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found after authentication')
        useAuthStore.getState().logout()
        return
      }
      checkSetupStatus()
    }
  }, [isAuthenticated, checkSetupStatus])

  const shouldShowSetup = isAuthenticated && !isLoading && !isSetupComplete

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/setup" element={
            isAuthenticated ? (
              isSetupComplete ? <Navigate to="/" /> : <CompanySetup />
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                isLoading ? (
                  <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-gray-600">Loading...</div>
                  </div>
                ) : shouldShowSetup ? (
                  <Navigate to="/setup" />
                ) : (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/mails" element={<Mails />} />
                      <Route path="/email-automation" element={<EmailAutomation />} />
                      <Route path="/storage" element={<Storage />} />
                    
                    {/* Store Module Routes */}
                    <Route path="/store/requisitions" element={<PurchaseRequisitions />} />
                    <Route path="/store/purchase-orders" element={<div>Purchase Orders</div>} />
                    <Route path="/store/goods-receipt" element={<div>Goods Receipt</div>} />
                    <Route path="/store/inventory" element={<div>Inventory</div>} />
                    <Route path="/store/transfers" element={<div>Stock Transfers</div>} />
                    
                    {/* Finance Module Routes */}
                    <Route path="/finance" element={<FinanceDashboard />} />
                    <Route path="/finance/vendors" element={<VendorsPage />} />
                    <Route path="/finance/vendors/:id" element={<div>Vendor Details</div>} />
                    <Route path="/finance/invoices" element={<div>Invoices</div>} />
                    <Route path="/finance/payments" element={<div>Payments</div>} />
                    <Route path="/finance/receipts" element={<div>Receipts</div>} />
                    <Route path="/finance/banking" element={<div>Banking</div>} />
                    <Route path="/finance/gst" element={<div>GST Returns</div>} />
                    
                    {/* Procurement Module Routes */}
                    <Route path="/procurement" element={<ProcurementDashboard />} />
                    <Route path="/procurement/vendors" element={<VendorsProcurement />} />
                    <Route path="/procurement/vendors/:id" element={<VendorDetail />} />
                    <Route path="/procurement/requisitions" element={<PurchaseRequisitions />} />
                    <Route path="/procurement/requisitions/:id" element={<PurchaseRequisitionDetail />} />
                    <Route path="/procurement/rfqs" element={<RFQManagement />} />
                    <Route path="/procurement/purchase-orders" element={<div>Purchase Orders</div>} />
                    <Route path="/procurement/quotations" element={<div>Quotation Comparison</div>} />
                    <Route path="/procurement/grn" element={<div>Goods Receipt</div>} />
                    <Route path="/procurement/invoices" element={<div>Vendor Invoices</div>} />
                    <Route path="/procurement/payments" element={<div>Vendor Payments</div>} />
                    
                    {/* Masters Module Routes */}
                    <Route path="/masters/companies" element={<Companies />} />
                    <Route path="/masters/companies/edit" element={<CompanyEdit />} />
                    <Route path="/masters/divisions" element={<Divisions />} />
                    <Route path="/masters/departments" element={<Departments />} />
                    <Route path="/masters/materials" element={<MaterialMaster />} />
                    <Route path="/masters/vendors" element={<VendorMaster />} />
                    <Route path="/masters/customers" element={<div>Customers</div>} />
                    <Route path="/masters/accounts" element={<div>Chart of Accounts</div>} />
                    
                    {/* Other Routes */}
                    <Route path="/reports" element={<div>Reports</div>} />
                    <Route path="/settings" element={<div>Settings</div>} />
                    <Route path="/settings/email" element={<EmailSettings />} />
                    <Route path="/gmail-test" element={<GmailTest />} />
                  </Routes>
                </Layout>
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App