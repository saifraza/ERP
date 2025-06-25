import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Remove failed migration
app.get('/remove-migration', async (c) => {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250625_add_quotation_model'
    `
    
    return c.json({ 
      success: true, 
      message: 'Failed migration removed',
      rowsAffected: result
    })
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

export default app