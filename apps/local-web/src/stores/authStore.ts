import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  divisions: string[]
  linkedGmailEmail?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        // Clear all auth-related data
        localStorage.removeItem('token')
        localStorage.removeItem('erp-companies')
        localStorage.removeItem('company-storage')
        localStorage.removeItem('auth-storage')
        // Clear all localStorage items that might contain auth data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('user')) {
            localStorage.removeItem(key)
          }
        })
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)