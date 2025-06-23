// Storage configuration for persistent volume
export const storageConfig = {
  // Base path for Railway volume
  volumePath: process.env.NODE_ENV === 'production' ? '/data' : './data',
  
  // Storage paths
  paths: {
    uploads: 'uploads',
    documents: 'documents',
    temp: 'temp',
    cache: 'cache',
    reports: 'reports',
    invoices: 'invoices',
    attachments: 'attachments'
  },
  
  // Get full path for a storage type
  getPath: (type: keyof typeof storageConfig.paths) => {
    return `${storageConfig.volumePath}/${storageConfig.paths[type]}`
  },
  
  // File size limits
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 1024 * 1024 * 1024, // 1GB
  }
}

// Helper to check if running on Railway with volume
export const hasVolume = () => {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'production'
}

// Storage utilities
export const storage = {
  // Save file to volume (client-side)
  async saveFile(file: File, type: keyof typeof storageConfig.paths): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    const response = await fetch('/api/storage/upload', {
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
    return `/api/storage/file?path=${encodeURIComponent(path)}`
  },
  
  // Delete file
  async deleteFile(path: string): Promise<void> {
    const response = await fetch('/api/storage/delete', {
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