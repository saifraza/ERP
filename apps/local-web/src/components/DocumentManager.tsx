import { useState, useEffect } from 'react'
import { Upload, FileText, FileSpreadsheet, File, Search, Filter, Bot, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

interface Document {
  id: string
  fileName: string
  fileType: string
  category: string
  division?: string
  uploadedAt: string
  status: 'processing' | 'analyzed' | 'error'
  insights?: string
}

interface DocumentManagerProps {
  onAnalyze?: (doc: Document) => void
}

export default function DocumentManager({ onAnalyze }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-xxxx.up.railway.app'
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDivision, setSelectedDivision] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const categories = ['all', 'invoice', 'report', 'purchase_order', 'delivery_note', 'quality_cert', 'offer', 'contract']
  const divisions = ['all', 'sugar', 'power', 'ethanol', 'feed']

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5" />
      case 'excel':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5" />
      default:
        return <File className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      invoice: 'bg-blue-100 text-blue-800',
      report: 'bg-green-100 text-green-800',
      purchase_order: 'bg-purple-100 text-purple-800',
      delivery_note: 'bg-yellow-100 text-yellow-800',
      quality_cert: 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      
      // Determine category based on filename
      let category = 'report'
      const fileName = file.name.toLowerCase()
      if (fileName.includes('invoice') || fileName.includes('inv')) category = 'invoice'
      else if (fileName.includes('po') || fileName.includes('purchase')) category = 'purchase_order'
      else if (fileName.includes('offer') || fileName.includes('quotation')) category = 'offer'
      else if (fileName.includes('contract')) category = 'contract'
      
      formData.append('category', category)
      
      try {
        setLoading(true)
        const uploadToast = toast.loading(`Uploading ${file.name}...`)
        
        const response = await fetch(`${apiUrl}/api/documents/upload`, {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          toast.success(`${file.name} uploaded successfully`, { id: uploadToast })
          
          // Add to local state
          const newDoc: Document = {
            ...data.document,
            status: 'processing'
          }
          setDocuments(prev => [newDoc, ...prev])
          
          // Trigger AI analysis
          analyzeDocument(newDoc.id)
        } else {
          toast.error(`Failed to upload ${file.name}`, { id: uploadToast })
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Error uploading ${file.name}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const analyzeDocument = async (documentId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'general' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                status: 'analyzed', 
                insights: data.analysis.insights || 'Analysis complete'
              }
            : doc
        ))
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'error' } : doc
      ))
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesDivision = selectedDivision === 'all' || doc.division === selectedDivision
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesDivision && matchesSearch
  })

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Management</h2>
        <p className="text-gray-600">Upload and analyze factory documents with AI</p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Supports: PDF, Excel, Word, Images (JPG, PNG)
        </p>
        <label className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Select Files
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {divisions.map(div => (
            <option key={div} value={div}>
              {div === 'all' ? 'All Divisions' : div.charAt(0).toUpperCase() + div.slice(1)}
            </option>
          ))}
        </select>

        <button className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </button>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents found
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-gray-400">
                  {getFileIcon(doc.fileType)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category.replace('_', ' ')}
                    </span>
                    {doc.division && (
                      <span className="text-xs text-gray-500">
                        {doc.division.charAt(0).toUpperCase() + doc.division.slice(1)} Division
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {doc.uploadedAt}
                    </span>
                  </div>
                  {doc.insights && (
                    <p className="text-sm text-gray-600 mt-1">{doc.insights}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(doc.status)}
                {doc.status === 'analyzed' && (
                  <button
                    onClick={() => onAnalyze?.(doc)}
                    className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                  >
                    <Bot className="h-4 w-4 mr-1" />
                    AI Insights
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}