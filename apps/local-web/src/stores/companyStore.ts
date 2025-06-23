import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Company {
  id: string
  code: string
  name: string
  legalName: string
  gstNumber: string
  panNumber: string
  factories: Factory[]
}

interface Factory {
  id: string
  code: string
  name: string
  type: string
  city: string
  state: string
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
  checkSetupStatus: () => Promise<boolean>
  clearSelection: () => void
}

// Initialize from localStorage immediately
const getInitialState = () => {
  try {
    const localCompanies = localStorage.getItem('erp-companies')
    if (localCompanies) {
      const companies = JSON.parse(localCompanies)
      console.log('Initial companies from localStorage:', companies)
      return {
        companies,
        isSetupComplete: companies.length > 0,
        currentCompany: companies[0] || null,
        currentFactory: companies[0]?.factories?.[0] || null
      }
    }
  } catch (error) {
    console.error('Error loading initial state:', error)
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
          
          // Try API first
          try {
            const response = await fetch(`${apiUrl}/api/companies`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              const companies = data.companies || []
              
              // Update localStorage with API data
              localStorage.setItem('erp-companies', JSON.stringify(companies))
              
              get().setCompanies(companies)
              set({ isSetupComplete: companies.length > 0 })
              return
            }
          } catch (apiError) {
            console.log('API not available, falling back to localStorage')
          }
          
          // Fallback to localStorage
          const localCompanies = localStorage.getItem('erp-companies')
          if (localCompanies) {
            const companies = JSON.parse(localCompanies)
            get().setCompanies(companies)
            set({ isSetupComplete: companies.length > 0 })
          } else {
            set({ isSetupComplete: false })
          }
        } catch (error) {
          console.error('Failed to load companies:', error)
          set({ isSetupComplete: false })
        } finally {
          set({ isLoading: false })
        }
      },

      checkSetupStatus: async () => {
        const state = get()
        console.log('Checking setup status, current companies:', state.companies)
        
        // First check if we already have companies
        if (state.companies.length > 0) {
          console.log('Companies already loaded, setup is complete')
          return true
        }
        
        // Otherwise try to load
        await state.loadCompanies()
        
        const isComplete = get().isSetupComplete
        console.log('Setup complete status after loading:', isComplete)
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
      })
    }
  )
)