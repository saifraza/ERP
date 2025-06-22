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