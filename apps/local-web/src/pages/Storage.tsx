import { useState } from 'react'
import { HardDrive, Upload, FileText, Trash2, Download, RefreshCw } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import { useStorage } from '../hooks/useStorage'

export default function Storage() {
  const { storageInfo, loading, error, refresh, formatBytes } = useStorage()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ path: string; id: string }>>([])

  const handleFileUpload = (path: string, id: string) => {
    setUploadedFiles(prev => [...prev, { path, id }])
    refresh() // Refresh storage info after upload
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading storage info...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <HardDrive className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Volume Storage</h1>
            <p className="text-sm text-gray-600">
              Persistent storage at {storageInfo?.volumePath || '/data'}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Storage Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Storage Overview</h2>
        
        {storageInfo && (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Used: {formatBytes(storageInfo.storage.used)}</span>
                <span>Total: {formatBytes(storageInfo.storage.limit)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    storageInfo.storage.percentage > 80 ? 'bg-red-600' :
                    storageInfo.storage.percentage > 60 ? 'bg-yellow-500' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${storageInfo.storage.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {storageInfo.storage.percentage.toFixed(1)}% used
              </p>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {storageInfo.categories.map(cat => (
                <div key={cat.category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{cat.count}</span>
                  </div>
                  <p className="text-xs text-gray-600">{cat.category}</p>
                  <p className="text-xs text-gray-500">{formatBytes(cat.size)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h2>
        <FileUpload 
          onUpload={handleFileUpload}
          category="documents"
        />
      </div>

      {/* Recently Uploaded */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recently Uploaded</h2>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{file.path}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-500">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Notice */}
      {storageInfo?.isProduction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HardDrive className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Railway Volume Active
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Files are being stored in Railway's persistent volume at {storageInfo.volumePath}.
                This ensures your data persists across deployments and container restarts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}