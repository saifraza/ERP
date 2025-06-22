import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['*'], // Allow all origins for now
  credentials: true,
}))

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ERP Cloud API',
    version: '0.0.1'
  })
})

// Analytics endpoints
app.get('/api/analytics/dashboard', (c) => {
  return c.json({
    divisions: {
      sugar: { production: 2450, efficiency: 92.5 },
      power: { generation: 12.5, export: 8.5 },
      ethanol: { production: 45000, purity: 99.8 },
      feed: { production: 890, quality: 18.2 }
    },
    alerts: [
      { type: 'info', message: 'All systems operational', timestamp: new Date() }
    ]
  })
})

// Multi-plant comparison
app.get('/api/analytics/plants', (c) => {
  return c.json({
    plants: [
      {
        id: 'plant-1',
        name: 'Main Plant',
        location: 'Maharashtra',
        capacity: 5000,
        utilization: 92.5
      }
    ]
  })
})

// Documents analytics
app.get('/api/analytics/documents', (c) => {
  return c.json({
    summary: {
      total: 1250,
      pending: 45,
      processed: 1205,
      rejected: 12
    },
    byType: {
      invoice: 450,
      purchase_order: 320,
      contract: 180,
      offer: 150,
      other: 150
    },
    recentActivity: [
      {
        id: '1',
        action: 'processed',
        document: 'Invoice-2025-001.pdf',
        timestamp: new Date().toISOString()
      }
    ],
    processingTime: {
      average: 2.5, // minutes
      min: 0.5,
      max: 8.2
    }
  })
})

import { saveDocument, getDocument, documentExists } from './utils/storage.js'

// Document storage endpoint for MCP server
app.post('/api/documents', async (c) => {
  try {
    const body = await c.req.json()
    const { fileName, fileType, category, content, extractedData, metadata } = body
    
    // Save file to Railway volume
    let storedFileName = null
    if (content) {
      storedFileName = await saveDocument(fileName, content)
      console.log(`File saved to volume: ${storedFileName}`)
    }
    
    // In production, also save metadata to database
    const document = {
      id: `doc-${Date.now()}`,
      fileName,
      storedFileName, // Reference to file in volume
      fileType,
      category,
      size: content ? content.length : 0,
      extractedData,
      metadata,
      status: 'stored',
      volumePath: storedFileName ? `/documents/${storedFileName}` : null,
      createdAt: new Date().toISOString(),
      message: 'Document stored successfully in Railway volume'
    }
    
    console.log(`Stored document: ${fileName} (${fileType})`)
    
    return c.json(document, 201)
  } catch (error) {
    console.error('Error storing document:', error)
    return c.json({ error: 'Failed to store document' }, 500)
  }
})

// Get document by ID
app.get('/api/documents/:id', (c) => {
  const id = c.req.param('id')
  
  // Mock response - in production would fetch from database
  return c.json({
    id,
    fileName: 'Sample-Document.pdf',
    fileType: 'invoice',
    category: 'invoice',
    status: 'processed',
    extractedData: {
      invoiceNumber: 'INV-2025-001',
      totalAmount: '5000',
      vendor: 'Sample Vendor'
    },
    createdAt: new Date().toISOString()
  })
})

// List all documents
app.get('/api/documents', (c) => {
  // Mock response - in production would fetch from database
  return c.json({
    documents: [
      {
        id: 'doc-1',
        fileName: 'Invoice-2025-001.pdf',
        fileType: 'invoice',
        status: 'processed',
        createdAt: new Date().toISOString()
      },
      {
        id: 'doc-2',
        fileName: 'PO-2025-045.pdf',
        fileType: 'purchase_order',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ],
    total: 2
  })
})

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

const port = process.env.PORT || 3001
console.log(`ERP Cloud API running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}