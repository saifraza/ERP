import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { getGmailService } from '../services/gmail.js'
import { multiTenantGmail } from '../services/multi-tenant-gmail.js'

const app = new Hono()

// Debug endpoints - protect with auth
app.use('*', authMiddleware)

// Check OAuth scopes and permissions
app.get('/oauth-scopes', async (c) => {
  try {
    const gmailService = getGmailService()
    
    // Get current scopes
    const tokenInfo = await gmailService.oauth2Client.getAccessToken()
    
    if (!tokenInfo.token) {
      return c.json({ 
        error: 'No access token available',
        suggestion: 'OAuth might not be configured properly'
      }, 500)
    }
    
    // Try to decode JWT to see scopes
    let decoded: any = {}
    try {
      const parts = tokenInfo.token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      const payload = parts[1]
      // Add padding if needed
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4)
      decoded = JSON.parse(Buffer.from(padded, 'base64').toString())
    } catch (decodeError) {
      console.error('Failed to decode JWT:', decodeError)
      // Try alternative method - get token info from Google
      try {
        const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenInfo.token}`)
        if (tokenInfoResponse.ok) {
          decoded = await tokenInfoResponse.json()
        }
      } catch (fetchError) {
        console.error('Failed to get token info from Google:', fetchError)
      }
    }
    
    const currentScopes = decoded.scope ? decoded.scope.split(' ') : []
    
    // Check required scopes
    const requiredScopes = {
      gmail_read: 'https://www.googleapis.com/auth/gmail.readonly',
      gmail_send: 'https://www.googleapis.com/auth/gmail.send',
      gmail_modify: 'https://www.googleapis.com/auth/gmail.modify',
      calendar_read: 'https://www.googleapis.com/auth/calendar.readonly',
      calendar_write: 'https://www.googleapis.com/auth/calendar'
    }
    
    const scopeStatus = Object.entries(requiredScopes).reduce((acc, [key, scope]) => {
      acc[key] = {
        scope,
        enabled: currentScopes.includes(scope)
      }
      return acc
    }, {} as any)
    
    // Test calendar access
    let calendarTest = { success: false, error: null }
    try {
      const { google } = await import('googleapis')
      const calendar = google.calendar({ version: 'v3', auth: gmailService.oauth2Client })
      const events = await calendar.events.list({
        calendarId: 'primary',
        maxResults: 1
      })
      calendarTest = { 
        success: true, 
        error: null,
        hasEvents: (events.data.items?.length || 0) > 0
      }
    } catch (error: any) {
      calendarTest = { 
        success: false, 
        error: error?.message || 'Calendar access failed'
      }
    }
    
    return c.json({
      currentScopes,
      scopeStatus,
      calendarTest,
      email: decoded.email,
      suggestion: !scopeStatus.calendar_read.enabled 
        ? 'Calendar scope not enabled. You need to re-authorize with calendar permissions.'
        : 'All required scopes are enabled'
    })
  } catch (error: any) {
    return c.json({
      error: 'Failed to check OAuth scopes',
      details: error?.message
    }, 500)
  }
})

// Test calendar endpoint directly
app.get('/test-calendar', async (c) => {
  try {
    const gmailService = getGmailService()
    
    // List events
    const events = await gmailService.listCalendarEvents(5)
    
    return c.json({
      success: true,
      eventCount: events.length,
      events,
      message: 'Calendar access is working'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error?.message,
      suggestion: 'Check if calendar scope is enabled in OAuth'
    }, 500)
  }
})

// Simple OAuth config check
app.get('/oauth-config', async (c) => {
  try {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN
    
    const clientId = process.env.GOOGLE_CLIENT_ID || ''
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || ''
    
    return c.json({
      configured: hasClientId && hasClientSecret && hasRefreshToken,
      hasClientId,
      hasClientSecret,
      hasRefreshToken,
      clientIdFormat: clientId.includes('.apps.googleusercontent.com'),
      clientIdLength: clientId.length,
      refreshTokenLength: refreshToken.length,
      refreshTokenSample: refreshToken.substring(0, 10) + '...',
      environment: process.env.NODE_ENV,
      suggestion: (!hasClientId || !hasClientSecret || !hasRefreshToken) 
        ? 'Missing OAuth credentials in environment variables'
        : 'OAuth credentials are configured'
    })
  } catch (error: any) {
    return c.json({
      error: 'Failed to check OAuth config',
      details: error?.message
    }, 500)
  }
})

export default app