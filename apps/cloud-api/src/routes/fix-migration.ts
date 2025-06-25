import { Hono } from 'hono'
import { execSync } from 'child_process'

const app = new Hono()

// Temporary endpoint to fix migration
app.get('/resolve', async (c) => {
  try {
    // Run the resolve command
    const output = execSync('npx prisma migrate resolve --rolled-back 20250625_add_quotation_model', {
      encoding: 'utf8'
    })
    
    return c.json({ 
      success: true, 
      message: 'Migration marked as rolled back',
      output 
    })
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr 
    }, 500)
  }
})

// Check migration status
app.get('/status', async (c) => {
  try {
    const { prisma } = await import('../lib/prisma.js')
    
    // Check migrations table
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at 
      FROM _prisma_migrations 
      ORDER BY started_at DESC 
      LIMIT 10
    ` as any[]
    
    return c.json({ 
      success: true, 
      migrations 
    })
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// Manual fix - mark migration as rolled back in database
app.post('/manual-fix', async (c) => {
  try {
    const { prisma } = await import('../lib/prisma.js')
    
    // Update the migration record to mark it as rolled back
    await prisma.$executeRaw`
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          rolled_back_at = NOW() 
      WHERE migration_name = '20250625_add_quotation_model'
    `
    
    return c.json({ 
      success: true, 
      message: 'Migration manually marked as rolled back' 
    })
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

export default app