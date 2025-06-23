import { useState, useEffect } from 'react'

interface StorageInfo {
  volumePath: string
  isProduction: boolean
  storage: {
    used: number
    limit: number
    percentage: number
  }
  categories: Array<{
    category: string
    count: number
    size: number
  }>
}

export function useStorage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStorageInfo()
  }, [])

  const fetchStorageInfo = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
      const response = await fetch(`${apiUrl}/api/storage/info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch storage info')
      }

      const data = await response.json()
      setStorageInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    storageInfo,
    loading,
    error,
    refresh: fetchStorageInfo,
    formatBytes
  }
}