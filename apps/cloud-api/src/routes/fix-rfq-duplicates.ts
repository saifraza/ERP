import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

// Fix duplicate RFQ email responses
app.post('/fix-duplicates', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true, role: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Only admins can run this fix
    if (companyUser.role !== 'ADMIN' && companyUser.role !== 'OWNER') {
      return c.json({ error: 'Admin role required' }, 403)
    }
    
    console.log('Starting duplicate RFQ email response cleanup...')
    
    // Find all duplicate email responses
    const duplicates = await prisma.$queryRaw`
      SELECT 
        r."emailId",
        r."rfqId",
        r."vendorId",
        COUNT(*) as count,
        MIN(r."createdAt") as first_created,
        MAX(r."createdAt") as last_created,
        array_agg(r.id ORDER BY r."createdAt") as ids
      FROM "RFQEmailResponse" r
      JOIN "RFQ" rfq ON r."rfqId" = rfq.id
      WHERE rfq."companyId" = ${companyUser.companyId}
      GROUP BY r."emailId", r."rfqId", r."vendorId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    ` as any[]
    
    console.log(`Found ${duplicates.length} groups of duplicate email responses`)
    
    let deletedCount = 0
    const errors = []
    
    // For each group of duplicates, keep the first one and delete the rest
    for (const group of duplicates) {
      try {
        const idsToDelete = group.ids.slice(1) // Keep first, delete rest
        
        console.log(`Deleting ${idsToDelete.length} duplicates for emailId: ${group.emailId}`)
        
        await prisma.rFQEmailResponse.deleteMany({
          where: {
            id: { in: idsToDelete }
          }
        })
        
        deletedCount += idsToDelete.length
      } catch (error) {
        console.error(`Error deleting duplicates for emailId ${group.emailId}:`, error)
        errors.push({
          emailId: group.emailId,
          error: error.message
        })
      }
    }
    
    // Get summary of remaining responses
    const summary = await prisma.rFQEmailResponse.groupBy({
      by: ['processingStatus'],
      where: {
        rfq: {
          companyId: companyUser.companyId
        }
      },
      _count: true
    })
    
    return c.json({
      success: true,
      duplicatesFound: duplicates.length,
      recordsDeleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      currentSummary: summary.map(s => ({
        status: s.processingStatus,
        count: s._count
      }))
    })
    
  } catch (error: any) {
    console.error('Error fixing duplicate RFQ responses:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get RFQ email response statistics
app.get('/stats', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!companyUser?.companyId) {
      return c.json({ error: 'User not associated with a company' }, 400)
    }
    
    // Get duplicate statistics
    const duplicateStats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT "emailId") as unique_emails,
        COUNT(*) as total_records,
        COUNT(*) - COUNT(DISTINCT "emailId") as duplicate_records,
        MAX(count) as max_duplicates_per_email
      FROM (
        SELECT r."emailId", COUNT(*) as count
        FROM "RFQEmailResponse" r
        JOIN "RFQ" rfq ON r."rfqId" = rfq.id
        WHERE rfq."companyId" = ${companyUser.companyId}
        GROUP BY r."emailId"
      ) as email_counts
    ` as any[]
    
    // Get responses by vendor
    const vendorStats = await prisma.$queryRaw`
      SELECT 
        v.name as vendor_name,
        v.id as vendor_id,
        COUNT(DISTINCT r."emailId") as unique_responses,
        COUNT(*) as total_records,
        COUNT(*) - COUNT(DISTINCT r."emailId") as duplicate_records
      FROM "RFQEmailResponse" r
      JOIN "Vendor" v ON r."vendorId" = v.id
      JOIN "RFQ" rfq ON r."rfqId" = rfq.id
      WHERE rfq."companyId" = ${companyUser.companyId}
      GROUP BY v.id, v.name
      HAVING COUNT(*) > COUNT(DISTINCT r."emailId")
      ORDER BY duplicate_records DESC
    ` as any[]
    
    // Get recent duplicates
    const recentDuplicates = await prisma.$queryRaw`
      SELECT 
        r."emailId",
        r.subject,
        r."fromEmail",
        v.name as vendor_name,
        rfq."rfqNumber",
        COUNT(*) as duplicate_count,
        MIN(r."createdAt") as first_created,
        MAX(r."createdAt") as last_created
      FROM "RFQEmailResponse" r
      JOIN "Vendor" v ON r."vendorId" = v.id
      JOIN "RFQ" rfq ON r."rfqId" = rfq.id
      WHERE rfq."companyId" = ${companyUser.companyId}
        AND r."createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY r."emailId", r.subject, r."fromEmail", v.name, rfq."rfqNumber"
      HAVING COUNT(*) > 1
      ORDER BY MAX(r."createdAt") DESC
      LIMIT 20
    ` as any[]
    
    return c.json({
      success: true,
      summary: duplicateStats[0] || {
        unique_emails: 0,
        total_records: 0,
        duplicate_records: 0,
        max_duplicates_per_email: 0
      },
      vendorsWithDuplicates: vendorStats,
      recentDuplicates: recentDuplicates
    })
    
  } catch (error: any) {
    console.error('Error getting RFQ response stats:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app