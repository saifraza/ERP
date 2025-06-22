import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import ModernLayout from './layouts/ModernLayout'
import Dashboard from './pages/Dashboard'
import DashboardModern from './pages/DashboardModern'
import Login from './pages/Login'
import Documents from './pages/Documents'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import Vendors from './pages/finance/Vendors'
import VendorsModern from './pages/finance/VendorsModern'
import { useAuthStore } from './stores/authStore'

const queryClient = new QueryClient()

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  // Use modern UI by default - can be toggled via settings
  const useModernUI = true

  const Layout = useModernUI ? ModernLayout : MainLayout
  const DashboardPage = useModernUI ? DashboardModern : Dashboard
  const VendorsPage = useModernUI ? VendorsModern : Vendors

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/documents" element={<Documents />} />
                    
                    {/* Store Module Routes */}
                    <Route path="/store/requisitions" element={<div>Material Requisitions</div>} />
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
                    
                    {/* Masters Module Routes */}
                    <Route path="/masters/companies" element={<div>Companies</div>} />
                    <Route path="/masters/materials" element={<div>Materials</div>} />
                    <Route path="/masters/vendors" element={<div>Vendor Master</div>} />
                    <Route path="/masters/customers" element={<div>Customers</div>} />
                    <Route path="/masters/accounts" element={<div>Chart of Accounts</div>} />
                    
                    {/* Other Routes */}
                    <Route path="/reports" element={<div>Reports</div>} />
                    <Route path="/settings/*" element={<div>Settings</div>} />
                  </Routes>
                </Layout>
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