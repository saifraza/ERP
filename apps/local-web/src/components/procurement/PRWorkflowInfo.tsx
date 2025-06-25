import { ArrowRight, Send, CheckCircle, FileText, Package, Receipt } from 'lucide-react'

export default function PRWorkflowInfo() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
        Purchase Requisition Workflow
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">1. Submit PR</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              When you click "Submit", the PR status changes from DRAFT to SUBMITTED. 
              The PR is now locked and sent for approval. You can no longer edit it.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">2. Manager Approval</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Authorized managers can approve or reject the PR. If approved, status changes to APPROVED.
              If rejected, it returns to DRAFT with comments.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">3. Convert to RFQ/PO</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Once approved, the PR can be converted to an RFQ (for quotations) or directly to a PO.
              This initiates the procurement process with vendors.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">4. Goods Receipt</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              When materials arrive, a GRN is created. PR status updates to PARTIALLY_ORDERED or ORDERED
              based on fulfillment.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Only users with appropriate roles (ADMIN, MANAGER) can approve PRs. 
          The approval hierarchy is based on PR value and material criticality.
        </p>
      </div>
    </div>
  )
}