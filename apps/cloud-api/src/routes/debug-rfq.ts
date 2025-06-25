import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Debug endpoint to check RFQ table structure
app.get('/check-fields', async (c) => {
  try {
    // Get column information from PostgreSQL
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'RFQVendor'
      ORDER BY ordinal_position;
    ` as any[]
    
    const rfqColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'RFQ'
      ORDER BY ordinal_position;
    ` as any[]
    
    return c.json({
      success: true,
      RFQVendor_columns: columns,
      RFQ_columns: rfqColumns
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Test fetching a simple RFQ
app.get('/test-rfq/:id', async (c) => {
  const rfqId = c.req.param('id')
  
  try {
    // Try simplest query first
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId }
    })
    
    if (!rfq) {
      return c.json({ error: 'RFQ not found' }, 404)
    }
    
    // Try with basic relations
    const rfqWithRelations = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        vendors: true,
        items: true
      }
    })
    
    return c.json({
      success: true,
      basic_rfq: rfq,
      with_relations: rfqWithRelations
    })
  } catch (error: any) {
    return c.json({ 
      error: error.message,
      type: error.constructor.name,
      code: error.code
    }, 500)
  }
})

export default app