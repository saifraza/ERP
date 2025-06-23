// Define storage paths
const storagePaths = {
  uploads: 'uploads',
  documents: 'documents',
  temp: 'temp',
  cache: 'cache',
  reports: 'reports',
  invoices: 'invoices',
  attachments: 'attachments'
} as const

// Storage configuration for persistent volume
export const storageConfig = {
  // Base path for Railway volume (determined by API)
  volumePath: '/data',
  
  // Storage paths
  paths: storagePaths,
  
  // Get full path for a storage type
  getPath: (type: keyof typeof storagePaths) => {
    return `${storageConfig.volumePath}/${storagePaths[type]}`
  },
  
  // File size limits
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 1024 * 1024 * 1024, // 1GB
  }
}

// Helper to check if running on Railway with volume
export const hasVolume = () => {
  // This will be determined by the API response
  return true
}

// Storage utilities
export const storage = {
  // Save file to volume (client-side)
  async saveFile(file: File, type: keyof typeof storagePaths): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type as string)
    
    const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
    const response = await fetch(`${apiUrl}/api/storage/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload file')
    }
    
    const data = await response.json()
    return data.path
  },
  
  // Get file URL
  getFileUrl(path: string): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
    return `${apiUrl}/api/storage/file?path=${encodeURIComponent(path)}`
  },
  
  // Delete file
  async deleteFile(path: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
    const response = await fetch(`${apiUrl}/api/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }
}