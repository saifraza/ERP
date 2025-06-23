import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'
import { google } from 'googleapis'

const app = new Hono()

// Protect all routes
app.use('*', authMiddleware)

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}/api/email-oauth/callback`
)

// Initiate OAuth flow for a company
app.get('/connect/:companyId', async (c) => {
  const companyId = c.req.param('companyId')
  const user = c.get('user')
  
  // Check if user has access to this company
  // TODO: Add proper authorization check
  
  // Generate OAuth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.metadata',
      'https://www.googleapis.com/auth/calendar'
    ],
    state: JSON.stringify({ companyId, userId: user.id }),
    prompt: 'consent' // Force consent to ensure we get refresh token
  })
  
  return c.json({
    authUrl,
    message: 'Redirect user to authUrl to connect their Google account'
  })
})

// OAuth callback
app.get('/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')
    
    if (error) {
      return c.redirect(`/settings/email?error=${error}`)
    }
    
    if (!code || !state) {
      return c.redirect('/settings/email?error=missing_params')
    }
    
    // Parse state
    const { companyId, userId } = JSON.parse(state)
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.refresh_token) {
      return c.redirect('/settings/email?error=no_refresh_token')
    }
    
    // Get user info to get email address
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    if (!userInfo.email) {
      return c.redirect('/settings/email?error=no_email')
    }
    
    // Store credentials
    await multiTenantGmail.storeCredentials(
      companyId,
      userInfo.email,
      tokens.refresh_token,
      'google'
    )
    
    // Redirect to success page
    return c.redirect(`/settings/email?success=connected&email=${userInfo.email}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return c.redirect('/settings/email?error=oauth_failed')
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

export default app