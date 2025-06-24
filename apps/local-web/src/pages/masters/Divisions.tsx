import { useState, useEffect } from 'react'
import { 
  Building2, Plus, Search, Edit2, Trash2, 
  CheckCircle, XCircle, Settings, AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface Division {
  id: string
  name: string
  code: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export default function Divisions() {
  const { token } = useAuthStore()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [hasExistingDivisions, setHasExistingDivisions] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/divisions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDivisions(data.divisions || [])
        setHasExistingDivisions((data.divisions || []).length > 0)
      }
    } catch (error) {
      console.error('Error fetching divisions:', error)
      toast.error('Failed to load divisions')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupDivisions = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/setup-divisions/create-defaults`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Default divisions created successfully!')
        fetchDivisions()
      } else {
        toast.error(data.error || 'Failed to create divisions')
      }
    } catch (error) {
      toast.error('Failed to create divisions')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const url = editingDivision 
        ? `${import.meta.env.VITE_API_URL}/api/divisions/${editingDivision.id}`
        : `${import.meta.env.VITE_API_URL}/api/divisions`
        
      const response = await fetch(url, {
        method: editingDivision ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingDivision ? 'Division updated successfully' : 'Division created successfully')
        setShowAddModal(false)
        setEditingDivision(null)
        setFormData({ name: '', code: '' })
        fetchDivisions()
      } else {
        toast.error(data.error || 'Failed to save division')
      }
    } catch (error) {
      toast.error('Failed to save division')
    }
  }

  const handleEdit = (division: Division) => {
    setEditingDivision(division)
    setFormData({
      name: division.name,
      code: division.code
    })
    setShowAddModal(true)
  }

  const handleDelete = async (divisionId: string) => {
    if (!confirm('Are you sure you want to delete this division?')) {
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/divisions/${divisionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Division deleted successfully')
        fetchDivisions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete division')
      }
    } catch (error) {
      toast.error('Failed to delete division')
    }
  }

  const filteredDivisions = divisions.filter(division =>
    division.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    division.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Divisions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage business divisions for multi-unit operations</p>
        </div>
        <button
          onClick={() => {
            setEditingDivision(null)
            setFormData({ name: '', code: '' })
            setShowAddModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Division
        </button>
      </div>

      {/* Quick Setup Section - Only show if no divisions exist */}
      {!hasExistingDivisions && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Setup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create default divisions for integrated sugar factory operations
                </p>
              </div>
            </div>
            <button
              onClick={handleSetupDivisions}
              disabled={setupLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {setupLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                'Create Default Divisions'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search divisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Divisions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {divisions.length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Production Units</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {divisions.filter(d => ['SUGAR', 'ETHANOL', 'POWER', 'FEED'].includes(d.code)).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support Units</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {divisions.filter(d => d.code === 'COMMON').length}
              </p>
            </div>
            <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Divisions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Division Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDivisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No divisions found matching your search' : 'No divisions created yet'}
                  </td>
                </tr>
              ) : (
                filteredDivisions.map((division) => (
                  <tr key={division.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {division.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                        {division.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {['SUGAR', 'ETHANOL', 'POWER', 'FEED'].includes(division.code) ? 'Production' : 'Support'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(division.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(division)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(division.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setShowAddModal(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingDivision ? 'Edit Division' : 'New Division'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Division Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Sugar Division"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Division Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., SUGAR"
                    maxLength={10}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Short code for the division (max 10 characters)
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingDivision ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}