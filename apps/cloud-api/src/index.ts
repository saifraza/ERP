import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'

// Import routes
import authRoutes from './routes/auth.js'
import companiesRoutes from './routes/companies.js'
import setupRoutes from './routes/setup.js'
import mcpRoutes from './routes/mcp.js'
import fixDataRoutes from './routes/fix-data.js'
import storageRoutes from './routes/storage.js'
import emailOAuthRoutes from './routes/email-oauth.js'
import assistantRoutes from './routes/assistant.js'
import debugRoutes from './routes/debug.js'
import emailRoutes from './routes/email.js'
import geminiAssistantRoutes from './routes/gemini-assistant.js'
import emailAutomationRoutes from './routes/email-automation.js'
import vendorsRoutes from './routes/vendors.js'
import requisitionsRoutes from './routes/requisitions.js'
import rfqsRoutes from './routes/rfqs.js'
import rfqEmailProcessingRoutes from './routes/rfq-email-processing.js'
import divisionsRoutes from './routes/divisions.js'
import setupDivisionsRoutes from './routes/setup-divisions.js'
import departmentsRoutes from './routes/departments.js'
import materialsRoutes from './routes/materials.js'
import factoriesRoutes from './routes/factories.js'
import procurementDashboardRoutes from './routes/procurement-dashboard.js'
import procurementStatsRoutes from './routes/procurement-stats.js'
import debugRfqRoutes from './routes/debug-rfq.js'
import rfqEmailHistoryRoutes from './routes/rfq-email-history.js'
import testEmailLogRoutes from './routes/test-email-log.js'
import checkEmailTablesRoutes from './routes/check-email-tables.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())

// Simple CORS middleware that works
app.use('*', async (c, next) => {
  // Get origin from request
  const origin = c.req.header('Origin')
  
  // Always set CORS headers
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin)
  } else {
    c.header('Access-Control-Allow-Origin', '*')
  }
  
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  c.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
  
  // Handle OPTIONS preflight requests
  if (c.req.method === 'OPTIONS') {
    c.header('Access-Control-Max-Age', '86400') // 24 hours
    return c.text('', 204)
  }
  
  await next()
})

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
app.route('/api/mcp', mcpRoutes)
app.route('/api/fix-data', fixDataRoutes)
app.route('/api/storage', storageRoutes)
app.route('/api/email-oauth', emailOAuthRoutes)
app.route('/api/assistant', assistantRoutes)
app.route('/api/debug', debugRoutes)
app.route('/api/email', emailRoutes)
app.route('/api/gemini', geminiAssistantRoutes)
app.route('/api/email-automation', emailAutomationRoutes)
app.route('/api/vendors', vendorsRoutes)
app.route('/api/requisitions', requisitionsRoutes)
app.route('/api/rfqs', rfqsRoutes)
app.route('/api/rfq-emails', rfqEmailProcessingRoutes)
app.route('/api/divisions', divisionsRoutes)
app.route('/api/setup-divisions', setupDivisionsRoutes)
app.route('/api/departments', departmentsRoutes)
app.route('/api/materials', materialsRoutes)
app.route('/api/factories', factoriesRoutes)
app.route('/api/procurement/dashboard', procurementDashboardRoutes)
app.route('/api/procurement/stats', procurementStatsRoutes)
app.route('/api/debug-rfq', debugRfqRoutes)
app.route('/api/rfq-email-history', rfqEmailHistoryRoutes)
app.route('/api/test-email-log', testEmailLogRoutes)
app.route('/api/check-email-tables', checkEmailTablesRoutes)

// Debug endpoint to check users (remove in production)
app.get('/api/debug/users', async (c) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    })
    return c.json({ users })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Database status endpoint
app.get('/api/db-status', async (c) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    
    // Try to query the database
    await prisma.$queryRaw`SELECT 1`
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ` as any[]
    
    let userCount = 0
    let companyCount = 0
    
    try {
      userCount = await prisma.user.count()
      companyCount = await prisma.company.count()
    } catch (e) {
      // Tables might not exist yet
    }
    
    return c.json({
      status: 'connected',
      tableCount: tables.length,
      tables: tables.map((t: any) => t.table_name),
      data: {
        users: userCount,
        companies: companyCount
      },
      needsMigration: tables.length === 0
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Run migrations endpoint (temporary for setup)
app.post('/api/run-migrations', async (c) => {
  try {
    const { execSync } = await import('child_process')
    
    // First generate client to ensure types are available
    execSync('npx prisma generate', {
      cwd: process.cwd(),
      encoding: 'utf8'
    })
    
    // Run migrations
    const migrationOutput = execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      encoding: 'utf8'
    })
    
    // Run seed
    const seedOutput = execSync('npm run seed', {
      cwd: process.cwd(),
      encoding: 'utf8'
    })
    
    return c.json({
      status: 'success',
      migration: migrationOutput,
      seed: seedOutput
    })
  } catch (error) {
    console.error('Migration error:', error)
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Fix failed migration
app.get('/api/fix-failed-migration', async (c) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    
    // Delete the failed migration record
    await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250625_add_quotation_model'
    `
    
    return c.json({
      status: 'success',
      message: 'Failed migration removed'
    })
  } catch (error) {
    console.error('Fix migration error:', error)
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