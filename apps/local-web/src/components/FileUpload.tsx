import { useState } from 'react'
import { Upload, X, File, CheckCircle } from 'lucide-react'
import { storage } from '../config/storage'

interface FileUploadProps {
  onUpload?: (path: string, fileId: string) => void
  accept?: string
  maxSize?: number
  category?: 'uploads' | 'documents' | 'invoices' | 'attachments'
}

export default function FileUpload({ 
  onUpload, 
  accept = '*', 
  maxSize = 10 * 1024 * 1024,
  category = 'uploads' 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{ path: string; id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
      return
    }

    setSelectedFile(file)
    setError(null)
    setUploadedFile(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const path = await storage.saveFile(selectedFile, category)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Assume the response includes an ID
      const fileId = path.split('/').pop()?.split('.')[0] || ''
      
      setUploadedFile({ path, id: fileId })
      onUpload?.(path, fileId)
      
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null)
        setUploadProgress(0)
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadedFile(null)
    setUploadProgress(0)
    setError(null)
  }

  return (
    <div className="w-full">
      {!selectedFile && !uploadedFile && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Max file size: {maxSize / 1024 / 1024}MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileSelect}
          />
        </label>
      )}

      {selectedFile && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <File className="w-5 h-5 mr-2 text-gray-400" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="ml-2 text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-500"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {!uploadedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload to Volume'}
            </button>
          )}

          {uploadedFile && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Uploaded successfully!</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Storage info */}
      <div className="mt-4 text-xs text-gray-500">
        Files are stored in Railway's persistent volume at /data
      </div>
    </div>
  )
}