import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'
import { google } from 'googleapis'
import { prisma } from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

const app = new Hono()

// Initialize OAuth2 client with error handling
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.API_URL || 'https://cloud-api-production-0f4d.up.railway.app'}/api/email-oauth-user/callback`
  
  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials not configured')
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.')
  }
  
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

// Initiate OAuth flow for current user
app.get('/connect', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const user = c.get('user')
    
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
      state: JSON.stringify({ userId }),
      prompt: 'consent', // Force consent to ensure we get refresh token
      login_hint: user.linkedGmailEmail // Pre-fill with the linked email
    })
    
    return c.json({ 
      success: true,
      authUrl 
    })
  } catch (error: any) {
    console.error('OAuth connect error:', error)
    return c.json({ 
      success: false,
      error: error.message || 'Failed to generate OAuth URL'
    }, 500)
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
      return c.redirect(`${frontendUrl}/mails?error=${error}`)
    }
    
    if (!code || !state) {
      return c.redirect(`${frontendUrl}/mails?error=missing_params`)
    }
    
    // Parse state
    const { userId } = JSON.parse(state)
    
    // Get OAuth client
    const oauth2Client = getOAuth2Client()
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.refresh_token) {
      return c.redirect(`${frontendUrl}/mails?error=no_refresh_token`)
    }
    
    // Get user info to get email address
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    if (!userInfo.email) {
      return c.redirect(`${frontendUrl}/mails?error=no_email`)
    }
    
    // Store credentials for the user
    await multiTenantGmail.storeCredentials(
      userId,
      userInfo.email,
      tokens.refresh_token,
      'google'
    )
    
    // Update user's linkedGmailEmail if different
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedGmailEmail: true }
    })
    
    if (user && user.linkedGmailEmail !== userInfo.email) {
      await prisma.user.update({
        where: { id: userId },
        data: { linkedGmailEmail: userInfo.email }
      })
    }
    
    // Redirect to frontend success page
    return c.redirect(`${frontendUrl}/mails?success=connected&email=${userInfo.email}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return c.redirect(`${frontendUrl}/mails?error=oauth_failed`)
  }
})

// Check if user has linked email
app.get('/status', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Check for EmailCredential
    const credential = await prisma.emailCredential.findFirst({
      where: {
        userId,
        provider: 'google',
        isActive: true
      },
      select: {
        emailAddress: true,
        lastSynced: true,
        createdAt: true
      }
    })
    
    // Also get user's linkedGmailEmail
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedGmailEmail: true }
    })
    
    return c.json({
      success: true,
      hasCredentials: !!credential,
      emailAddress: credential?.emailAddress || user?.linkedGmailEmail || null,
      lastSynced: credential?.lastSynced,
      needsOAuth: !credential && !!user?.linkedGmailEmail
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to check email status'
    }, 500)
  }
})

// Remove email credentials
app.delete('/disconnect', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    // Find and deactivate all credentials for this user
    await prisma.emailCredential.updateMany({
      where: {
        userId,
        provider: 'google'
      },
      data: {
        isActive: false
      }
    })
    
    return c.json({
      success: true,
      message: 'Email disconnected successfully'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to disconnect email'
    }, 500)
  }
})

export default app