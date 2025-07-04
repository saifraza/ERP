import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

app.use('*', authMiddleware)

// Debug endpoint to check email setup
app.get('/check', async (c) => {
  try {
    const userId = c.get('userId')
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        linkedGmailEmail: true,
        name: true
      }
    })
    
    // Get email credentials
    const credentials = await prisma.emailCredential.findMany({
      where: { userId },
      select: {
        id: true,
        emailAddress: true,
        provider: true,
        isActive: true,
        lastSynced: true,
        createdAt: true
      }
    })
    
    // Get company info
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId },
      include: {
        company: true
      }
    })
    
    return c.json({
      user: {
        id: user?.id,
        email: user?.email,
        linkedGmailEmail: user?.linkedGmailEmail,
        name: user?.name
      },
      emailCredentials: credentials,
      company: companyUser?.company,
      status: {
        hasLinkedEmail: !!user?.linkedGmailEmail,
        hasCredentials: credentials.length > 0,
        isReady: !!user?.linkedGmailEmail && credentials.length > 0
      }
    })
  } catch (error) {
    console.error('Debug email check error:', error)
    return c.json({ error: 'Failed to check email status' }, 500)
  }
})

// Test email connection
app.get('/test-connection', async (c) => {
  try {
    const userId = c.get('userId')
    
    // Try to list emails
    const { multiTenantGmail } = await import('../services/multi-tenant-gmail.js')
    
    try {
      const emails = await multiTenantGmail.listEmails(userId, 1)
      return c.json({
        success: true,
        message: 'Email connection is working',
        emailCount: emails.length,
        firstEmail: emails[0] ? {
          subject: emails[0].subject,
          from: emails[0].from,
          date: emails[0].date
        } : null
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: 'Email connection failed',
        details: error.message,
        userId: userId
      }, 500)
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return c.json({ error: 'Failed to test connection' }, 500)
  }
})

// Force clear all email data
app.post('/force-clear', async (c) => {
  try {
    const userId = c.get('userId')
    
    console.log('Force clearing email data for user:', userId)
    
    let clearedEmail = false
    let clearedCreds = false
    
    try {
      // Use raw SQL to ensure it clears - use empty string
      const result = await prisma.$executeRaw`UPDATE "User" SET "linkedGmailEmail" = '' WHERE id = ${userId}`
      console.log('Updated user rows:', result)
      clearedEmail = true
    } catch (e) {
      console.error('Error clearing linkedGmailEmail:', e)
    }
    
    try {
      // Also clear any credentials
      const credResult = await prisma.$executeRaw`DELETE FROM "EmailCredential" WHERE "userId" = ${userId}`
      console.log('Deleted credential rows:', credResult)
      clearedCreds = true
    } catch (e) {
      console.error('Error clearing credentials:', e)
    }
    
    if (clearedEmail || clearedCreds) {
      return c.json({
        success: true,
        message: 'Force cleared email data',
        clearedEmail,
        clearedCreds
      })
    } else {
      throw new Error('Could not clear any data')
    }
  } catch (error: any) {
    console.error('Force clear error:', error)
    return c.json({ 
      error: 'Failed to force clear', 
      details: error.message 
    }, 500)
  }
})

// Simple clear just the linked email
app.post('/clear-linked-email', async (c) => {
  try {
    const userId = c.get('userId')
    
    // First get the current user to see what's there
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    console.log('Current user before clear:', {
      id: currentUser?.id,
      email: currentUser?.email,
      linkedGmailEmail: currentUser?.linkedGmailEmail
    })
    
    // Now clear the linkedGmailEmail field - use empty string
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { linkedGmailEmail: '' }
    })
    
    console.log('User after clear:', {
      id: updatedUser.id,
      email: updatedUser.email,
      linkedGmailEmail: updatedUser.linkedGmailEmail
    })
    
    return c.json({
      success: true,
      message: 'Cleared linked email',
      previousEmail: currentUser?.linkedGmailEmail,
      currentEmail: updatedUser.linkedGmailEmail
    })
  } catch (error: any) {
    console.error('Clear linked email error:', error)
    return c.json({ 
      error: 'Failed to clear linked email', 
      details: error.message 
    }, 500)
  }
})

// Direct update with specific user ID
app.post('/fix-email/:userId', async (c) => {
  try {
    const targetUserId = c.req.param('userId')
    const authUserId = c.get('userId')
    
    // Only allow if it's the same user
    if (targetUserId !== authUserId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    console.log('Fixing email for user:', targetUserId)
    
    // First, let's see what's actually in the database
    const beforeUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    console.log('User before update:', beforeUser)
    
    // Try multiple approaches
    let result = 0
    
    // Approach 1: Direct SQL with exact match
    try {
      result = await prisma.$executeRaw`
        UPDATE "User" 
        SET "linkedGmailEmail" = '' 
        WHERE id = ${targetUserId} 
        AND "linkedGmailEmail" = 'perchase@mspil.in'
      `
      console.log('Approach 1 result:', result)
    } catch (e) {
      console.error('Approach 1 failed:', e)
    }
    
    // Approach 2: Update without condition
    if (result === 0) {
      try {
        result = await prisma.$executeRaw`
          UPDATE "User" 
          SET "linkedGmailEmail" = '' 
          WHERE id = ${targetUserId}
        `
        console.log('Approach 2 result:', result)
      } catch (e) {
        console.error('Approach 2 failed:', e)
      }
    }
    
    // Approach 3: Use Prisma ORM
    if (result === 0) {
      try {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { linkedGmailEmail: '' }
        })
        result = 1
        console.log('Approach 3 succeeded')
      } catch (e) {
        console.error('Approach 3 failed:', e)
      }
    }
    
    // Verify the update
    const afterUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    console.log('User after update:', afterUser)
    
    return c.json({
      success: true,
      message: 'Attempted to fix email issue',
      beforeEmail: beforeUser?.linkedGmailEmail,
      afterEmail: afterUser?.linkedGmailEmail,
      updatedRows: result
    })
  } catch (error: any) {
    console.error('Fix email error:', error)
    return c.json({ 
      error: 'Failed to fix email', 
      details: error.message 
    }, 500)
  }
})

// Nuclear option - force update with transaction
app.post('/nuclear-clear/:userId', async (c) => {
  try {
    const targetUserId = c.req.param('userId')
    const authUserId = c.get('userId')
    
    if (targetUserId !== authUserId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    console.log('Nuclear clear for user:', targetUserId)
    
    // Use a transaction to ensure it happens
    const result = await prisma.$transaction(async (tx) => {
      // Clear email credentials
      await tx.emailCredential.deleteMany({
        where: { userId: targetUserId }
      })
      
      // Force update user - use empty string instead of null
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { 
          linkedGmailEmail: '', // Empty string instead of null
          updatedAt: new Date() // Force a change
        }
      })
      
      return user
    })
    
    console.log('Nuclear clear result:', result)
    
    return c.json({
      success: true,
      message: 'Nuclear clear completed',
      user: {
        id: result.id,
        email: result.email,
        linkedGmailEmail: result.linkedGmailEmail
      }
    })
  } catch (error: any) {
    console.error('Nuclear clear error:', error)
    return c.json({ 
      error: 'Nuclear clear failed', 
      details: error.message 
    }, 500)
  }
})

export default app