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

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      currentCompany: null,
      currentFactory: null,
      companies: [],
      isLoading: false,
      isSetupComplete: false,

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
          // Check localStorage first for development
          const localCompanies = localStorage.getItem('erp-companies')
          if (localCompanies) {
            const companies = JSON.parse(localCompanies)
            get().setCompanies(companies)
            set({ isSetupComplete: companies.length > 0 })
            set({ isLoading: false })
            return
          }

          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
          const response = await fetch(`${apiUrl}/api/setup/companies`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            get().setCompanies(data.companies || [])
            set({ isSetupComplete: data.companies.length > 0 })
          }
        } catch (error) {
          console.error('Failed to load companies:', error)
          // For development, check localStorage
          const localCompanies = localStorage.getItem('erp-companies')
          if (localCompanies) {
            const companies = JSON.parse(localCompanies)
            get().setCompanies(companies)
            set({ isSetupComplete: companies.length > 0 })
          }
        } finally {
          set({ isLoading: false })
        }
      },

      checkSetupStatus: async () => {
        const state = get()
        if (!state.companies.length) {
          await state.loadCompanies()
        }
        return get().isSetupComplete
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