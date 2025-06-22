import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Documents from './pages/Documents'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import Vendors from './pages/finance/Vendors'
import { useAuthStore } from './stores/authStore'

const queryClient = new QueryClient()

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/sugar/*" element={<div>Sugar Division</div>} />
                    <Route path="/power/*" element={<div>Power Division</div>} />
                    <Route path="/ethanol/*" element={<div>Ethanol Division</div>} />
                    <Route path="/feed/*" element={<div>Animal Feed Division</div>} />
                    <Route path="/farmers/*" element={<div>Farmer Management</div>} />
                    <Route path="/weighbridge/*" element={<div>Weighbridge</div>} />
                    <Route path="/finance" element={<FinanceDashboard />} />
                    <Route path="/finance/vendors" element={<Vendors />} />
                    <Route path="/finance/vendors/:id" element={<div>Vendor Details</div>} />
                    <Route path="/finance/indents" element={<div>Indents</div>} />
                    <Route path="/finance/rfq" element={<div>RFQs</div>} />
                    <Route path="/finance/purchase-orders" element={<div>Purchase Orders</div>} />
                    <Route path="/finance/invoices" element={<div>Invoices</div>} />
                    <Route path="/finance/payments" element={<div>Payments</div>} />
                    <Route path="/settings/*" element={<div>Settings</div>} />
                  </Routes>
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App