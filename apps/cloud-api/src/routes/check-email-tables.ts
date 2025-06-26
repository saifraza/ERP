import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Public endpoint - no auth required for debugging
app.get('/', async (c) => {
  try {
    console.log('=== Checking Email Tables ===')
    
    const results = {
      databaseConnected: false,
      tables: {
        RFQEmailLog: { exists: false, count: 0, error: null as any },
        RFQEmailResponse: { exists: false, count: 0, error: null as any },
        RFQCommunicationThread: { exists: false, count: 0, error: null as any }
      },
      rfqCount: 0,
      vendorCount: 0
    }
    
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      results.databaseConnected = true
    } catch (e) {
      return c.json({ error: 'Database not connected', details: e })
    }
    
    // Check RFQEmailLog
    try {
      results.tables.RFQEmailLog.count = await prisma.rFQEmailLog.count()
      results.tables.RFQEmailLog.exists = true
    } catch (e: any) {
      results.tables.RFQEmailLog.error = e.message
    }
    
    // Check RFQEmailResponse
    try {
      results.tables.RFQEmailResponse.count = await prisma.rFQEmailResponse.count()
      results.tables.RFQEmailResponse.exists = true
    } catch (e: any) {
      results.tables.RFQEmailResponse.error = e.message
    }
    
    // Check RFQCommunicationThread
    try {
      results.tables.RFQCommunicationThread.count = await prisma.rFQCommunicationThread.count()
      results.tables.RFQCommunicationThread.exists = true
    } catch (e: any) {
      results.tables.RFQCommunicationThread.error = e.message
    }
    
    // Get counts
    results.rfqCount = await prisma.rFQ.count()
    results.vendorCount = await prisma.vendor.count()
    
    // If tables don't exist, provide SQL to create them
    const tableMissing = !results.tables.RFQEmailLog.exists || 
                        !results.tables.RFQEmailResponse.exists || 
                        !results.tables.RFQCommunicationThread.exists
    
    if (tableMissing) {
      return c.json({
        ...results,
        message: 'Email tables are missing! Run the migration SQL below on your Railway database:',
        migrationSQL: `
-- Create RFQEmailLog table
CREATE TABLE IF NOT EXISTS "RFQEmailLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL DEFAULT 'rfq_sent',
    "emailId" TEXT,
    "subject" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "ccEmails" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQEmailLog_pkey" PRIMARY KEY ("id")
);

-- Create RFQEmailResponse table
CREATE TABLE IF NOT EXISTS "RFQEmailResponse" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "attachments" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "extractedData" TEXT,
    "quotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQEmailResponse_pkey" PRIMARY KEY ("id")
);

-- Create RFQCommunicationThread table
CREATE TABLE IF NOT EXISTS "RFQCommunicationThread" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "threadId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQCommunicationThread_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "RFQEmailLog_rfqId_idx" ON "RFQEmailLog"("rfqId");
CREATE INDEX IF NOT EXISTS "RFQEmailLog_vendorId_idx" ON "RFQEmailLog"("vendorId");
CREATE UNIQUE INDEX IF NOT EXISTS "RFQCommunicationThread_rfqId_vendorId_key" ON "RFQCommunicationThread"("rfqId", "vendorId");

-- Add foreign keys (optional - may fail if referential integrity issues)
ALTER TABLE "RFQEmailLog" ADD CONSTRAINT "RFQEmailLog_rfqId_fkey" 
  FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE;
ALTER TABLE "RFQEmailLog" ADD CONSTRAINT "RFQEmailLog_vendorId_fkey" 
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
        `
      })
    }
    
    return c.json({
      ...results,
      message: 'All email tables exist and are accessible'
    })
  } catch (error: any) {
    console.error('Check tables error:', error)
    return c.json({ 
      error: error.message,
      stack: error.stack 
    }, 500)
  }
})

// Force create a test email log
app.post('/force-create-log', async (c) => {
  try {
    // Get first RFQ with vendors
    const rfq = await prisma.rFQ.findFirst({
      where: {
        vendors: {
          some: {}
        }
      },
      include: {
        vendors: {
          include: {
            vendor: true
          }
        }
      }
    })
    
    if (!rfq) {
      return c.json({ error: 'No RFQ with vendors found' })
    }
    
    const vendor = rfq.vendors[0]
    
    // Force create using raw SQL if model fails
    try {
      const result = await prisma.$executeRaw`
        INSERT INTO "RFQEmailLog" 
        ("id", "rfqId", "vendorId", "emailType", "subject", "toEmail", "status", "sentAt")
        VALUES 
        (gen_random_uuid(), ${rfq.id}, ${vendor.vendorId}, 'rfq_sent', 'Test RFQ Email', ${vendor.vendor.email || 'test@example.com'}, 'sent', NOW())
      `
      
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RFQEmailLog" WHERE "rfqId" = ${rfq.id}`
      
      return c.json({
        success: true,
        message: 'Email log created using raw SQL',
        rfqId: rfq.id,
        rfqNumber: rfq.rfqNumber,
        vendorName: vendor.vendor.name,
        recordsInserted: result,
        totalCount: count
      })
    } catch (e: any) {
      return c.json({
        error: 'Failed to insert using raw SQL',
        details: e.message,
        rfqId: rfq.id
      })
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default app