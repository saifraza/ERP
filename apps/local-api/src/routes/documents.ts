import { Hono } from 'hono'

const documents = new Hono()

// Get all documents
documents.get('/', async (c) => {
  try {
    // Mock data for now - will be replaced with database queries
    const mockDocuments = [
      {
        id: '1',
        name: 'Invoice-2025-001.pdf',
        type: 'invoice',
        category: 'purchase',
        supplier: 'ABC Chemicals Ltd',
        date: '2025-01-15',
        amount: 250000,
        status: 'pending',
        extractedData: {
          invoiceNumber: 'INV-2025-001',
          items: [
            { name: 'Sulfuric Acid', quantity: 100, unit: 'L', price: 2500 }
          ]
        }
      },
      {
        id: '2',
        name: 'PO-2025-050.pdf',
        type: 'purchase_order',
        category: 'purchase',
        supplier: 'XYZ Equipment Co',
        date: '2025-01-10',
        amount: 500000,
        status: 'approved',
        extractedData: {
          poNumber: 'PO-2025-050',
          deliveryDate: '2025-02-01',
          items: [
            { name: 'Centrifuge Pump', quantity: 2, unit: 'pcs', price: 250000 }
          ]
        }
      }
    ]

    return c.json({
      success: true,
      data: mockDocuments,
      total: mockDocuments.length
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch documents'
    }, 500)
  }
})

// Get document by ID
documents.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    // Mock single document
    const mockDocument = {
      id,
      name: 'Invoice-2025-001.pdf',
      type: 'invoice',
      category: 'purchase',
      supplier: 'ABC Chemicals Ltd',
      date: '2025-01-15',
      amount: 250000,
      status: 'pending',
      extractedData: {
        invoiceNumber: 'INV-2025-001',
        supplierAddress: '123 Industrial Area, Mumbai',
        taxInfo: {
          gst: '27AAAAA0000A1Z5',
          taxAmount: 45000
        },
        items: [
          { 
            name: 'Sulfuric Acid', 
            quantity: 100, 
            unit: 'L', 
            price: 2500,
            total: 250000
          }
        ],
        terms: 'Net 30 days',
        dueDate: '2025-02-14'
      },
      metadata: {
        uploadedBy: 'admin@erp.com',
        uploadedAt: '2025-01-15T10:30:00Z',
        fileSize: '2.5MB',
        pages: 3
      }
    }

    return c.json({
      success: true,
      data: mockDocument
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Document not found'
    }, 404)
  }
})

// Upload document
documents.post('/upload', async (c) => {
  try {
    // Mock upload response
    const mockResponse = {
      id: '3',
      name: 'Contract-2025-010.pdf',
      type: 'contract',
      status: 'processing',
      message: 'Document uploaded successfully and queued for processing'
    }

    return c.json({
      success: true,
      data: mockResponse
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to upload document'
    }, 500)
  }
})

// Update document status
documents.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    return c.json({
      success: true,
      data: {
        id,
        status: body.status,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update document status'
    }, 500)
  }
})

// Delete document
documents.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    return c.json({
      success: true,
      message: `Document ${id} deleted successfully`
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete document'
    }, 500)
  }
})

// Search documents
documents.post('/search', async (c) => {
  const body = await c.req.json()
  
  try {
    // Mock search results
    const mockResults = [
      {
        id: '1',
        name: 'Invoice-2025-001.pdf',
        type: 'invoice',
        supplier: 'ABC Chemicals Ltd',
        date: '2025-01-15',
        amount: 250000,
        relevance: 0.95
      }
    ]

    return c.json({
      success: true,
      data: mockResults,
      query: body.query,
      total: mockResults.length
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Search failed'
    }, 500)
  }
})

export default documents