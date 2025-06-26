import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'
import { google } from 'googleapis'
import { prisma } from '../lib/prisma.js'

const app = new Hono()

// Protect most routes, but not connect and callback
app.use('*', async (c, next) => {
  const path = c.req.path
  
  // Skip auth for OAuth flow endpoints
  if (path.includes('/connect/') || path.includes('/callback') || path.includes('/user-connect')) {
    return next()
  }
  
  // Apply auth middleware for other routes
  return authMiddleware(c, next)
})

// Initialize OAuth2 client with error handling
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}/api/email-oauth/callback`
  
  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials not configured')
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.')
  }
  
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

// Initiate OAuth flow for current user
app.get('/user-connect', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No authorization token provided' }, 401)
    }
    
    // Decode token to get userId
    let userId = 'unknown'
    let companyId = 'unknown'
    try {
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      userId = decoded.userId
      
      // Get user's company
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          companies: {
            include: { company: true }
          }
        }
      })
      
      if (user?.companies?.[0]?.company?.id) {
        companyId = user.companies[0].company.id
      }
    } catch (err) {
      console.error('Token verification failed:', err)
    }
    
    // Get OAuth client
    const oauth2Client = getOAuth2Client()
    
    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: JSON.stringify({ companyId, userId }),
      prompt: 'consent'
    })
    
    return c.json({ authUrl })
  } catch (error: any) {
    console.error('OAuth user-connect error:', error)
    return c.json({ error: error.message || 'Failed to generate OAuth URL' }, 500)
  }
})

// Initiate OAuth flow for a company
app.get('/connect/:companyId', async (c) => {
  try {
    const companyId = c.req.param('companyId')
    const token = c.req.query('token')
    
    // Verify token if provided (for security)
    let userId = 'unknown'
    if (token) {
      try {
        const { prisma } = await import('../lib/prisma.js')
        const jwt = await import('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })
        
        if (!user) {
          throw new Error('Invalid user')
        }
      } catch (err) {
        console.error('Token verification failed:', err)
        // Continue anyway - OAuth will validate
      }
    }
    
    // Get OAuth client
    const oauth2Client = getOAuth2Client()
    
    // Generate OAuth URL with full Gmail access
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',  // Full read access to emails
        'https://www.googleapis.com/auth/gmail.send',       // Send emails
        'https://www.googleapis.com/auth/gmail.modify',     // Modify emails (labels, etc)
        'https://www.googleapis.com/auth/calendar',         // Calendar access
        'https://www.googleapis.com/auth/userinfo.email'    // Get user email
      ],
      state: JSON.stringify({ companyId, userId }),
      prompt: 'consent' // Force consent to ensure we get refresh token
    })
    
    // Redirect directly to Google OAuth
    return c.redirect(authUrl)
  } catch (error: any) {
    console.error('OAuth connect error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-production-adfe.up.railway.app'
    return c.redirect(`${frontendUrl}/settings/email?error=oauth_init_failed`)
  }
})

// OAuth callback
app.get('/callback', async (c) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-production-adfe.up.railway.app'
  
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')
    
    if (error) {
      return c.redirect(`${frontendUrl}/settings/email?error=${error}`)
    }
    
    if (!code || !state) {
      return c.redirect(`${frontendUrl}/settings/email?error=missing_params`)
    }
    
    // Parse state
    const { companyId, userId } = JSON.parse(state)
    
    // Get OAuth client
    const oauth2Client = getOAuth2Client()
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.refresh_token) {
      return c.redirect(`${frontendUrl}/settings/email?error=no_refresh_token`)
    }
    
    // Get user info to get email address
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    if (!userInfo.email) {
      return c.redirect(`${frontendUrl}/settings/email?error=no_email`)
    }
    
    // Store credentials - use userId not companyId!
    await multiTenantGmail.storeCredentials(
      userId,
      userInfo.email,
      tokens.refresh_token,
      'google'
    )
    
    // Also update the user's linkedGmailEmail
    const { prisma } = await import('../lib/prisma.js')
    await prisma.user.update({
      where: { id: userId },
      data: { linkedGmailEmail: userInfo.email }
    })
    
    // Redirect to frontend success page
    return c.redirect(`${frontendUrl}/settings/email?success=connected&email=${userInfo.email}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return c.redirect(`${frontendUrl}/settings/email?error=oauth_failed`)
  }
})

// List connected email accounts for current user
app.get('/my-accounts', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    const { prisma } = await import('../lib/prisma.js')
    const accounts = await prisma.emailCredential.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        emailAddress: true,
        provider: true,
        lastSynced: true,
        createdAt: true
      }
    })
    
    return c.json({
      success: true,
      accounts
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to list email accounts'
    }, 500)
  }
})

// List connected email accounts for a company (now uses userId from auth)
app.get('/accounts/:companyId', authMiddleware, async (c) => {
  const companyId = c.req.param('companyId')
  const userId = c.get('userId')
  
  try {
    const accounts = await multiTenantGmail.listEmailAccounts(userId)
    return c.json({
      success: true,
      accounts
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to list email accounts'
    }, 500)
  }
})

// Remove email account
app.delete('/accounts/:companyId/:email', authMiddleware, async (c) => {
  const companyId = c.req.param('companyId')
  const email = c.req.param('email')
  const userId = c.get('userId')
  
  try {
    await multiTenantGmail.removeEmailAccount(userId, email)
    return c.json({
      success: true,
      message: `Email account ${email} removed`
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to remove email account'
    }, 500)
  }
})

// Test email connection
app.post('/test/:companyId', authMiddleware, async (c) => {
  const companyId = c.req.param('companyId')
  const userId = c.get('userId')
  
  try {
    // Try to list a few emails
    const emails = await multiTenantGmail.listEmails(userId, 3)
    
    return c.json({
      success: true,
      message: 'Email connection working',
      emailCount: emails.length,
      account: emails[0]?.account || 'Unknown'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error?.message || 'Email connection failed'
    }, 500)
  }
})

// Debug endpoint to check OAuth configuration
app.get('/debug', async (c) => {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const clientIdLength = process.env.GOOGLE_CLIENT_ID?.length || 0
  const clientIdFormat = process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') || false
  
  return c.json({
    configured: hasClientId && hasClientSecret,
    hasClientId,
    hasClientSecret,
    clientIdLength,
    clientIdFormat,
    redirectUri: `${process.env.API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}/api/email-oauth/callback`
  })
})

// Clear current user's email credentials
app.post('/clear-credentials', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    console.log('Clearing credentials for user:', userId)
    
    try {
      // Delete all email credentials for this user (may be none)
      const deletedCreds = await prisma.emailCredential.deleteMany({
        where: { userId }
      })
      console.log('Deleted credentials:', deletedCreds.count)
    } catch (credError) {
      console.log('No credentials to delete or error deleting:', credError)
    }
    
    try {
      // Clear linkedGmailEmail from user (this is the main issue)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { linkedGmailEmail: '' } // Empty string since field is required
      })
      console.log('Cleared linkedGmailEmail from user:', updatedUser.email)
      
      return c.json({
        success: true,
        message: 'Email credentials and linked email cleared successfully'
      })
    } catch (updateError: any) {
      console.error('Error updating user:', updateError)
      throw updateError
    }
  } catch (error: any) {
    console.error('Clear credentials error:', error)
    return c.json({
      success: false,
      error: 'Failed to clear credentials',
      details: error.message
    }, 500)
  }
})

export default app