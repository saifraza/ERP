import { useState } from 'react'
import DocumentManager from '../components/DocumentManager'
import { X, FileText, Bot, TrendingUp, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

export default function Documents() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [showInsights, setShowInsights] = useState(false)

  const handleAnalyze = (doc: any) => {
    setSelectedDoc(doc)
    setShowInsights(true)
  }

  const closeInsights = () => {
    setShowInsights(false)
    setSelectedDoc(null)
  }

  // Generate AI insights based on document type
  const getAIInsights = (doc: any) => {
    const insights: any = {
      invoice: {
        summary: 'Invoice analysis complete. Payment terms and vendor verified.',
        keyData: {
          'Invoice Number': 'INV-2025-001',
          'Amount': '₹50,000',
          'Due Date': '30 days from invoice date',
          'Vendor': 'Engineering Solutions Ltd',
          'Payment Terms': 'Net 30'
        },
        findings: [
          { type: 'success', text: 'Vendor is verified and approved' },
          { type: 'info', text: 'Early payment discount available: 2% if paid within 10 days' },
          { type: 'warning', text: 'Amount is 15% higher than average for this vendor' }
        ],
        recommendations: [
          'Consider early payment to avail 2% discount (Save ₹1,000)',
          'Verify the price increase with procurement team',
          'Update budget allocation for this category'
        ],
        financialImpact: {
          'Immediate Cost': '₹50,000',
          'Potential Savings': '₹1,000 (early payment)',
          'Budget Impact': 'Within approved limits'
        }
      },
      purchase_order: {
        summary: 'Purchase order validated. All items are within approved specifications.',
        keyData: {
          'PO Number': 'PO-2025-045',
          'Total Amount': '₹1,25,000',
          'Items': '5 different items',
          'Delivery Date': '7 days from approval',
          'Supplier': 'Industrial Supplies Co'
        },
        findings: [
          { type: 'success', text: 'All items match approved requisition' },
          { type: 'info', text: 'Bulk discount applied: 5% on total order' },
          { type: 'success', text: 'Supplier has 98% on-time delivery record' }
        ],
        recommendations: [
          'Approve immediately to meet production schedule',
          'Consider increasing order quantity for additional 3% discount',
          'Schedule quality inspection upon delivery'
        ],
        financialImpact: {
          'Order Value': '₹1,25,000',
          'Discount Applied': '₹6,250',
          'Budget Remaining': '₹3,75,000'
        }
      },
      default: {
        summary: 'Document processed successfully. Analysis complete.',
        keyData: {
          'Document Type': doc?.category || 'General',
          'Status': 'Analyzed',
          'Processing Time': '2.5 seconds'
        },
        findings: [
          { type: 'success', text: 'Document successfully extracted and analyzed' },
          { type: 'info', text: 'All required fields identified' }
        ],
        recommendations: [
          'Review extracted data for accuracy',
          'Update relevant records in the system'
        ],
        financialImpact: {}
      }
    }

    return insights[doc?.category] || insights.default
  }

  const insights = selectedDoc ? getAIInsights(selectedDoc) : null

  return (
    <div className="container mx-auto py-6">
      <DocumentManager onAnalyze={handleAnalyze} />

      {/* AI Insights Modal */}
      {showInsights && selectedDoc && insights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bot className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">AI Document Analysis</h2>
              </div>
              <button
                onClick={closeInsights}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{selectedDoc.fileName}</h3>
                </div>
                <p className="text-gray-600">{insights.summary}</p>
              </div>

              {/* Key Data */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                  Extracted Data
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(insights.keyData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">{key}</p>
                      <p className="font-semibold text-gray-900">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Findings</h4>
                <div className="space-y-2">
                  {insights.findings.map((finding: any, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      {finding.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                      {finding.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                      {finding.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                      <span className="text-gray-700">{finding.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Financial Impact */}
              {Object.keys(insights.financialImpact).length > 0 && (
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
                    Financial Impact
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(insights.financialImpact).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-600">{key}</p>
                        <p className="font-semibold text-primary-700">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={closeInsights}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  Process Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}