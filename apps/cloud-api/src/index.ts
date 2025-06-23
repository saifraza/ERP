import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'

// Import routes
import authRoutes from './routes/auth.js'
import companiesRoutes from './routes/companies.js'
import setupRoutes from './routes/setup.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://frontend-production-adfe.up.railway.app'],
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
    version: '1.0.0',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
})

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/companies', companiesRoutes)
app.route('/api/setup', setupRoutes)

// Database status endpoint
app.get('/api/setup/db-status', async (c) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    
    // Try to query the database
    await prisma.$queryRaw`SELECT 1`
    
    // Get table counts
    const userCount = await prisma.user.count()
    const companyCount = await prisma.company.count()
    const factoryCount = await prisma.factory.count()
    
    return c.json({
      status: 'connected',
      tables: {
        users: userCount,
        companies: companyCount,
        factories: factoryCount
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
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
console.log(`Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`)