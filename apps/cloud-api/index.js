import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
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

// Mock authentication
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    console.log('Login attempt:', { email, password })
    
    // Mock users
    const users = {
      'admin@erp.com': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
      'manager@erp.com': { password: 'manager123', role: 'MANAGER', name: 'Manager User' },
      'operator@erp.com': { password: 'operator123', role: 'OPERATOR', name: 'Operator User' }
    }
    
    const user = users[email]
    if (user && user.password === password) {
      return c.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email,
          name: user.name,
          role: user.role,
          divisions: ['sugar', 'power', 'ethanol', 'feed']
        }
      })
    }
    
    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Server error' }, 500)
  }
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

// Document Management endpoints
app.post('/api/documents/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }
    
    // Read file content
    const buffer = await file.arrayBuffer()
    const content = Buffer.from(buffer).toString('base64')
    
    // Extract text content (mock - in production use OCR/PDF extraction)
    let extractedText = 'Document content would be extracted here...'
    if (file.type === 'text/plain') {
      extractedText = Buffer.from(buffer).toString('utf-8')
    }
    
    // Determine document properties
    const fileName = file.name
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'unknown'
    const category = formData.get('category') || determineCategory(fileName)
    
    const document = {
      id: Date.now().toString(),
      fileName: fileName,
      fileType: fileType,
      fileSize: file.size,
      fileUrl: `/storage/${Date.now()}-${fileName}`,
      category: category,
      division: formData.get('division') || null,
      content: extractedText,
      uploadedBy: '1', // Mock user ID
      createdAt: new Date(),
      status: 'processing'
    }
    
    // Store document metadata (in production, save to database)
    if (!globalThis.documents) {
      globalThis.documents = []
    }
    globalThis.documents.unshift(document)
    
    return c.json({
      success: true,
      document,
      message: 'Document uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Upload failed: ' + error.message }, 500)
  }
})

function determineCategory(fileName) {
  const name = fileName.toLowerCase()
  if (name.includes('invoice') || name.includes('inv')) return 'invoice'
  if (name.includes('po') || name.includes('purchase')) return 'purchase_order'
  if (name.includes('offer') || name.includes('quotation')) return 'offer'
  if (name.includes('contract')) return 'contract'
  if (name.includes('delivery')) return 'delivery_note'
  if (name.includes('quality') || name.includes('cert')) return 'quality_cert'
  return 'report'
}

// Get documents list
app.get('/api/documents', (c) => {
  const { category, division } = c.req.query()
  
  // Get stored documents or use defaults
  const documents = globalThis.documents || []
  
  let filtered = documents
  if (category && category !== 'all') {
    filtered = filtered.filter(d => d.category === category)
  }
  if (division && division !== 'all') {
    filtered = filtered.filter(d => d.division === division)
  }
  
  return c.json({ documents: filtered })
})

// Analyze document with AI
app.post('/api/documents/:id/analyze', async (c) => {
  const { id } = c.req.param()
  const { analysisType } = await c.req.json()
  
  // Simulate AI analysis
  const analysis = {
    id: Date.now().toString(),
    documentId: id,
    analysisType: analysisType || 'general',
    results: {
      summary: 'AI-generated summary of the document',
      keyPoints: [
        'Important finding 1',
        'Important finding 2',
        'Important finding 3'
      ],
      numbers: {
        totalAmount: 225000,
        items: 15,
        efficiency: 92.5
      }
    },
    insights: 'Based on the analysis, here are the key insights...',
    alerts: [
      { type: 'warning', message: 'Payment overdue by 5 days' },
      { type: 'info', message: 'Efficiency below target by 2.5%' }
    ],
    confidence: 0.87,
    createdAt: new Date()
  }
  
  return c.json({
    success: true,
    analysis
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

const port = parseInt(process.env.PORT || '3001')

serve({
  fetch: app.fetch,
  port: port
})

console.log(`ERP Cloud API running on port ${port}`)