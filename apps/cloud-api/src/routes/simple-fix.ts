import { Hono } from 'hono'

const app = new Hono()

// Simple test endpoint
app.get('/test', (c) => {
  return c.json({ 
    status: 'ok',
    message: 'Simple fix endpoint is working',
    timestamp: new Date().toISOString()
  })
})

// Direct SQL fix without Prisma
app.get('/fix-sql', async (c) => {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return c.json({ 
        success: false, 
        error: 'DATABASE_URL not found' 
      }, 500)
    }
    
    // Use pg directly
    const { default: pg } = await import('pg')
    const { Client } = pg
    
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    
    await client.connect()
    
    try {
      // Check for the migration
      const checkResult = await client.query(
        "SELECT migration_name FROM _prisma_migrations WHERE migration_name = '20250625_add_quotation_model'"
      )
      
      if (checkResult.rows.length === 0) {
        await client.end()
        return c.json({ 
          success: true, 
          message: 'Migration not found - already removed or never existed',
          found: false
        })
      }
      
      // Delete the migration
      const deleteResult = await client.query(
        "DELETE FROM _prisma_migrations WHERE migration_name = '20250625_add_quotation_model'"
      )
      
      await client.end()
      
      return c.json({ 
        success: true, 
        message: 'Migration removed successfully',
        rowsAffected: deleteResult.rowCount
      })
    } catch (queryError: any) {
      await client.end()
      throw queryError
    }
  } catch (error: any) {
    console.error('Direct SQL Error:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    }, 500)
  }
})

export default app