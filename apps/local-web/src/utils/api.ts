export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Simple API utility with axios-like interface
export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return { data: await response.json() }
  },
  
  post: async (endpoint: string, data?: any) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return { data: await response.json() }
  },
  
  put: async (endpoint: string, data?: any) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return { data: await response.json() }
  },
  
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return { data: await response.json() }
  }
}