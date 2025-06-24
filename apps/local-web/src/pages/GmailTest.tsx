import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { toast } from 'react-hot-toast'

export default function GmailTest() {
  const { token } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const runTest = async (testName: string, endpoint: string) => {
    try {
      setLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
      
      console.log(`Testing ${testName} at ${apiUrl}${endpoint}`)
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log(`${testName} Response:`, data)
      
      return {
        name: testName,
        success: response.ok,
        status: response.status,
        data
      }
    } catch (error: any) {
      console.error(`${testName} Error:`, error)
      return {
        name: testName,
        success: false,
        error: error.message
      }
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setTestResults(null)
    const results = []
    
    // Test 1: OAuth Configuration
    results.push(await runTest('OAuth Configuration', '/api/debug/oauth-config'))
    
    // Test 2: MCP Health Check
    results.push(await runTest('MCP Health Check', '/api/mcp/health'))
    
    // Test 3: OAuth Scopes
    results.push(await runTest('OAuth Scopes', '/api/debug/oauth-scopes'))
    
    // Test 4: Direct Calendar Test
    results.push(await runTest('Calendar Test', '/api/debug/test-calendar'))
    
    // Test 5: List Emails
    const emailTest = await fetch(
      `${import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}/api/mcp/gmail/list-emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxResults: 5 })
      }
    )
    const emailData = await emailTest.json()
    results.push({
      name: 'List Emails',
      success: emailTest.ok,
      status: emailTest.status,
      data: emailData
    })
    
    setTestResults(results)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gmail Integration Test
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Test all Gmail and Calendar endpoints
              </p>
            </div>
          </div>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Run All Tests
          </button>
        </div>

        {/* Connection Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Connection Info</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">API URL:</span> {import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Company:</span> {currentCompany?.name || 'No company selected'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Token:</span> {token ? `${token.substring(0, 20)}...` : 'No token'}
            </p>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Test Results</h3>
            {testResults.map((result: any, index: number) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {result.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Status: {result.status || 'N/A'}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        View Response
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data || result.error, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Troubleshooting Gmail Integration
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Make sure you're logged in with proper credentials</li>
            <li>Check if your OAuth token has calendar scope enabled</li>
            <li>Verify the API endpoints are accessible</li>
            <li>Check browser console for detailed error messages</li>
            <li>If calendar scope is missing, reconnect your email account</li>
          </ol>
        </div>
      </div>
    </div>
  )
}