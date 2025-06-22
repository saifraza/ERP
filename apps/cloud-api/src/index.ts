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