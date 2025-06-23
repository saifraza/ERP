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

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from Railway domains and localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://frontend-production-adfe.up.railway.app',
      'https://erp-frontend.up.railway.app'
    ]
    
    // Allow if origin is in the list or if no origin (same-origin requests)
    if (!origin || allowedOrigins.includes(origin)) {
      return origin || '*'
    }
    
    // Also allow any Railway subdomain
    if (origin?.includes('.up.railway.app')) {
      return origin
    }
    
    return null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 3600
}))

// Handle OPTIONS requests for CORS preflight
app.options('*', (c) => {
  return c.text('', 204)
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

// Create EmailCredential table (temporary)
app.post('/api/create-email-credential-table', async (c) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    
    // Create the EmailCredential table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EmailCredential" (
        "id" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "userId" TEXT,
        "emailAddress" TEXT NOT NULL,
        "provider" TEXT NOT NULL DEFAULT 'google',
        "googleRefreshToken" TEXT,
        "microsoftRefreshToken" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastSynced" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "EmailCredential_pkey" PRIMARY KEY ("id")
      )
    `
    
    // Create indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "EmailCredential_emailAddress_key" ON "EmailCredential"("emailAddress")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "EmailCredential_companyId_idx" ON "EmailCredential"("companyId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "EmailCredential_userId_idx" ON "EmailCredential"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "EmailCredential_provider_idx" ON "EmailCredential"("provider")`
    
    // Add foreign keys
    await prisma.$executeRaw`
      ALTER TABLE "EmailCredential" 
      ADD CONSTRAINT "EmailCredential_companyId_fkey" 
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "EmailCredential" 
      ADD CONSTRAINT "EmailCredential_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE
    `
    
    return c.json({
      status: 'success',
      message: 'EmailCredential table created successfully'
    })
  } catch (error) {
    console.error('Create table error:', error)
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