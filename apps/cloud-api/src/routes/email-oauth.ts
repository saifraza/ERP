import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'
import { google } from 'googleapis'

const app = new Hono()

// Protect most routes, but not connect and callback
app.use('*', async (c, next) => {
  const path = c.req.path
  
  // Skip auth for OAuth flow endpoints
  if (path.includes('/connect/') || path.includes('/callback')) {
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
    
    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/calendar'
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
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-production-adfe.up.railway.app'
    
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
    
    // Store credentials
    await multiTenantGmail.storeCredentials(
      companyId,
      userInfo.email,
      tokens.refresh_token,
      'google'
    )
    
    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-production-adfe.up.railway.app'
    return c.redirect(`${frontendUrl}/settings/email?success=connected&email=${userInfo.email}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-production-adfe.up.railway.app'
    return c.redirect(`${frontendUrl}/settings/email?error=oauth_failed`)
  }
})

// List connected email accounts for a company
app.get('/accounts/:companyId', async (c) => {
  const companyId = c.req.param('companyId')
  
  try {
    const accounts = await multiTenantGmail.listEmailAccounts(companyId)
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
app.delete('/accounts/:companyId/:email', async (c) => {
  const companyId = c.req.param('companyId')
  const email = c.req.param('email')
  
  try {
    await multiTenantGmail.removeEmailAccount(companyId, email)
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
app.post('/test/:companyId', async (c) => {
  const companyId = c.req.param('companyId')
  
  try {
    // Try to list a few emails
    const emails = await multiTenantGmail.listEmails(companyId, 3)
    
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

export default app