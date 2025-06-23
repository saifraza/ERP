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
    
    // Decode JWT to see scopes
    const payload = tokenInfo.token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    
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

export default app