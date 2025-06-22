import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import authRoutes from './routes/auth'
import divisionRoutes from './routes/divisions'
import farmerRoutes from './routes/farmers'
import weighbridgeRoutes from './routes/weighbridge'
import documentsRoutes from './routes/documents'
import financeRoutes from './routes/finance/index'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/divisions', divisionRoutes)
app.route('/api/farmers', farmerRoutes)
app.route('/api/weighbridge', weighbridgeRoutes)
app.route('/api/documents', documentsRoutes)
app.route('/api/finance', financeRoutes)

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
console.log(`Server running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}