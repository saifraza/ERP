import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Apply auth middleware
app.use('*', authMiddleware)

// Test RFQEmailLog creation
app.post('/test-email-log', async (c) => {
  try {
    console.log('=== Testing RFQEmailLog Creation ===')
    
    // Check if we can access the model
    const count = await prisma.rFQEmailLog.count()
    console.log('Current RFQEmailLog count:', count)
    
    // Get a test RFQ
    const rfq = await prisma.rFQ.findFirst({
      include: {
        vendors: {
          include: {
            vendor: true
          }
        }
      }
    })
    
    if (!rfq || rfq.vendors.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No RFQ with vendors found for testing' 
      }, 400)
    }
    
    const testVendor = rfq.vendors[0]
    console.log('Using RFQ:', rfq.rfqNumber, 'Vendor:', testVendor.vendor.name)
    
    // Try to create a test email log
    const testLog = await prisma.rFQEmailLog.create({
      data: {
        rfqId: rfq.id,
        vendorId: testVendor.vendorId,
        emailType: 'test',
        emailId: `test-${Date.now()}`,
        subject: 'Test Email Log',
        toEmail: testVendor.vendor.email || 'test@example.com',
        status: 'sent',
        sentAt: new Date()
      }
    })
    
    console.log('Test email log created:', testLog)
    
    // Count again
    const newCount = await prisma.rFQEmailLog.count()
    console.log('New RFQEmailLog count:', newCount)
    
    // Fetch back the created log
    const fetchedLog = await prisma.rFQEmailLog.findUnique({
      where: { id: testLog.id },
      include: {
        rfq: true,
        vendor: true
      }
    })
    
    return c.json({
      success: true,
      message: 'Test email log created successfully',
      previousCount: count,
      newCount: newCount,
      createdLog: testLog,
      fetchedLog: fetchedLog
    })
  } catch (error: any) {
    console.error('Test email log error:', error)
    return c.json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      errorMeta: error.meta
    }, 500)
  }
})

// Check RFQEmailLog table status
app.get('/check-email-log-table', async (c) => {
  try {
    // Try different ways to check if the table exists
    const checks = {
      count: null as number | null,
      canQuery: false,
      sampleRecords: [] as any[],
      error: null as any
    }
    
    try {
      checks.count = await prisma.rFQEmailLog.count()
      checks.canQuery = true
      
      // Try to fetch some records
      checks.sampleRecords = await prisma.rFQEmailLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    } catch (error: any) {
      checks.error = {
        message: error.message,
        code: error.code,
        meta: error.meta
      }
    }
    
    return c.json({
      success: true,
      tableStatus: checks
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app