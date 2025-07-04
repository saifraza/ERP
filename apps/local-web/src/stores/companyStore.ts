import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Company {
  id: string
  code: string
  name: string
  legalName: string
  gstNumber: string
  panNumber: string
  tanNumber?: string
  cinNumber?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  email: string
  phone: string
  website?: string
  fyStartMonth: number
  currentFY: string
  factories: Factory[]
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface Factory {
  id: string
  code: string
  name: string
  type: string
  addressLine1?: string
  addressLine2?: string
  city: string
  state: string
  pincode?: string
  crushingCapacity?: number
  powerCapacity?: number
  ethanolCapacity?: number
  gstNumber?: string
  factoryLicense?: string
  pollutionLicense?: string
}

interface CompanyStore {
  // Current selection
  currentCompany: Company | null
  currentFactory: Factory | null
  
  // All companies user has access to
  companies: Company[]
  
  // Loading states
  isLoading: boolean
  isSetupComplete: boolean
  
  // Actions
  setCurrentCompany: (company: Company) => void
  setCurrentFactory: (factory: Factory) => void
  setCompanies: (companies: Company[]) => void
  loadCompanies: () => Promise<void>
  fetchCompanies: () => Promise<void>
  checkSetupStatus: () => Promise<boolean>
  clearSelection: () => void
}

// Initialize with empty state - data will be loaded from API
const getInitialState = () => {
  // Clear any corrupted state on init
  if (typeof window !== 'undefined') {
    // Remove old corrupted company storage
    const stored = localStorage.getItem('company-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // If version is not 1, it's old corrupted data
        if (!parsed.version || parsed.version !== 1) {
          localStorage.removeItem('company-storage')
          console.log('Cleared old company storage')
        }
      } catch {
        localStorage.removeItem('company-storage')
      }
    }
  }
  
  return {
    companies: [],
    isSetupComplete: false,
    currentCompany: null,
    currentFactory: null
  }
}

const initialState = getInitialState()

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      currentCompany: initialState.currentCompany,
      currentFactory: initialState.currentFactory,
      companies: initialState.companies,
      isLoading: false,
      isSetupComplete: initialState.isSetupComplete,

      setCurrentCompany: (company) => {
        set({ 
          currentCompany: company,
          // Auto-select first factory if available
          currentFactory: company.factories?.[0] || null
        })
      },

      setCurrentFactory: (factory) => {
        set({ currentFactory: factory })
      },

      setCompanies: (companies) => {
        set({ companies })
        
        // If no current company selected and companies exist, select first
        const state = get()
        if (!state.currentCompany && companies.length > 0) {
          state.setCurrentCompany(companies[0])
        }
      },

      loadCompanies: async () => {
        set({ isLoading: true })
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('token')
          
          if (!token) {
            console.log('No token found, cannot load companies')
            set({ isSetupComplete: false, companies: [] })
            return
          }
          
          // Always try API first - no fallback to stale localStorage
          const response = await fetch(`${apiUrl}/api/companies`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            const companies = data.companies || []
            
            // Update localStorage with fresh API data
            localStorage.setItem('erp-companies', JSON.stringify(companies))
            
            get().setCompanies(companies)
            set({ isSetupComplete: companies.length > 0 })
          } else if (response.status === 401) {
            // Token expired or invalid
            console.log('Token invalid, clearing auth')
            localStorage.removeItem('token')
            localStorage.removeItem('auth-storage')
            set({ isSetupComplete: false, companies: [] })
          } else {
            // Other error - don't use stale data
            console.error('Failed to fetch companies:', response.status)
            set({ isSetupComplete: false, companies: [] })
          }
        } catch (error) {
          console.error('Failed to load companies:', error)
          // Network error - don't use stale data
          set({ isSetupComplete: false, companies: [] })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchCompanies: async () => {
        // Alias for loadCompanies for backward compatibility
        await get().loadCompanies()
      },

      checkSetupStatus: async () => {
        const state = get()
        console.log('Checking setup status, current companies:', state.companies)
        console.log('Current isSetupComplete state:', state.isSetupComplete)
        
        // Always load fresh from API
        await state.loadCompanies()
        
        // Get the latest state after loading
        const latestState = get()
        
        // Check if user has linked email (new requirement)
        const token = localStorage.getItem('token')
        let userHasLinkedEmail = false
        
        if (token) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (response.ok) {
              const userData = await response.json()
              userHasLinkedEmail = !!userData.user?.linkedGmailEmail
              console.log('User has linked email:', userHasLinkedEmail)
            }
          } catch (error) {
            console.error('Error checking user linked email:', error)
          }
        }
        
        // Setup is only complete if:
        // 1. Companies exist
        // 2. User has linked their Gmail account
        const hasCompanies = latestState.companies.length > 0
        const isComplete = hasCompanies && userHasLinkedEmail
        
        console.log('Setup check results:', {
          hasCompanies,
          userHasLinkedEmail,
          isSetupComplete: isComplete
        })
        
        // Force update the state to match reality
        set({ isSetupComplete: isComplete })
        
        return isComplete
      },

      clearSelection: () => {
        set({
          currentCompany: null,
          currentFactory: null
        })
      }
    }),
    {
      name: 'company-storage',
      partialize: (state) => ({
        currentCompany: state.currentCompany,
        currentFactory: state.currentFactory
        // Never persist isSetupComplete or companies - always fetch fresh
      }),
      version: 1, // Bump version to clear old persisted state
      migrate: (persistedState: any) => {
        // Clear any old state that might have isSetupComplete
        return {
          currentCompany: null,
          currentFactory: null
        }
      }
    }
  )
)