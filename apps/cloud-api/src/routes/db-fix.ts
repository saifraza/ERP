import { Hono } from 'hono'

const app = new Hono()

// Remove failed migration
app.get('/remove-migration', async (c) => {
  try {
    // Import prisma inside the handler to avoid initialization issues
    const { prisma } = await import('../lib/prisma.js')
    
    // First check if the migration exists
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      WHERE migration_name = '20250625_add_quotation_model'
    ` as any[]
    
    if (migrations.length === 0) {
      return c.json({ 
        success: true, 
        message: 'Migration not found - may have been already removed',
        found: false
      })
    }
    
    // Remove the migration
    const result = await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250625_add_quotation_model'
    `
    
    return c.json({ 
      success: true, 
      message: 'Failed migration removed',
      rowsAffected: result,
      found: true
    })
  } catch (error: any) {
    console.error('DB Fix Error:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, 500)
  }
})

// Check migration status
app.get('/check', async (c) => {
  try {
    const { prisma } = await import('../lib/prisma.js')
    
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at 
      FROM _prisma_migrations 
      ORDER BY started_at DESC 
      LIMIT 10
    ` as any[]
    
    return c.json({ 
      success: true, 
      migrations,
      total: migrations.length
    })
  } catch (error: any) {
    console.error('Check Error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

export default app