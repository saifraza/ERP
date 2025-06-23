import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export class GmailService {
  public oauth2Client: OAuth2Client
  public gmail: any
  private calendar: any

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Gmail OAuth credentials not configured')
    }
    
    // Log credential format for debugging (not the actual values)
    console.log('Gmail OAuth config:', {
      clientId: clientId.substring(0, 10) + '...',
      clientSecret: clientSecret.substring(0, 10) + '...',
      refreshToken: refreshToken.substring(0, 10) + '...',
      clientIdLength: clientId.length,
      hasValidFormat: clientId.includes('.apps.googleusercontent.com')
    })

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })

    // Set up automatic token refresh
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        console.log('New refresh token received')
      }
      console.log('Access token refreshed')
    })
    
    // Log the scopes to verify they're correct
    this.verifyScopes()

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async listEmails(maxResults: number = 10, query?: string) {
    try {
      // First, verify we have proper access
      console.log('Attempting to list emails with query:', query || '(no query)')
      
      // Test access with a simple profile check
      try {
        const profile = await this.gmail.users.getProfile({ userId: 'me' })
        console.log('Gmail profile verified:', {
          email: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal
        })
      } catch (profileError: any) {
        console.error('Profile access failed:', {
          error: profileError?.message,
          code: profileError?.code,
          errors: profileError?.errors
        })
      }
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || ''
      })

      const messages = response.data.messages || []
      
      // If no messages, return empty array
      if (messages.length === 0) {
        console.log('No messages found')
        return []
      }
      
      // Try to get full details, but handle 403 errors gracefully
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const detail = await this.gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date']
            })
            
            const headers = detail.data.payload?.headers || []
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const date = headers.find((h: any) => h.name === 'Date')?.value || ''
            
            return {
              id: msg.id,
              threadId: msg.threadId,
              subject,
              from,
              date,
              snippet: detail.data.snippet || ''
            }
          } catch (detailError: any) {
            console.error(`Failed to get details for message ${msg.id}:`, detailError?.message)
            // Return basic info if detail fetch fails
            return {
              id: msg.id,
              threadId: msg.threadId,
              subject: '(Unable to load)',
              from: 'Unknown',
              date: '',
              snippet: ''
            }
          }
        })
      )

      return emailDetails
    } catch (error: any) {
      console.error('Gmail list error:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        errors: error?.errors,
        response: error?.response?.data
      })
      
      // Provide more specific error messages
      if (error?.code === 401 || error?.response?.status === 401) {
        throw new Error('Gmail authentication failed. Refresh token may be invalid or expired.')
      }
      if (error?.code === 403 || error?.response?.status === 403) {
        throw new Error('Gmail access denied. Check API permissions and scopes.')
      }
      
      throw new Error(`Failed to fetch emails: ${error?.message || 'Unknown error'}`)
    }
  }

  async sendEmail(to: string, subject: string, body: string, cc?: string, bcc?: string) {
    try {
      const message = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${subject}`,
        '',
        body
      ].filter(Boolean).join('\r\n')

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      })

      return {
        success: true,
        messageId: response.data.id,
        message: 'Email sent successfully'
      }
    } catch (error) {
      console.error('Gmail send error:', error)
      throw new Error('Failed to send email')
    }
  }

  async listCalendarEvents(maxResults: number = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      const events = (response.data.items || []).map((event: any) => ({
        id: event.id,
        summary: event.summary || '(No Title)',
        start: event.start,
        end: event.end,
        location: event.location,
        description: event.description
      }))

      return events
    } catch (error) {
      console.error('Calendar list error:', error)
      throw new Error('Failed to fetch calendar events')
    }
  }

  async extractAttachments(messageId: string) {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      })

      const attachments = []
      const parts = message.data.payload?.parts || []
      
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachment = await this.gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: part.body.attachmentId
          })
          
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: attachment.data.size,
            data: attachment.data.data // Base64 encoded
          })
        }
      }

      return attachments
    } catch (error) {
      console.error('Attachment extraction error:', error)
      throw new Error('Failed to extract attachments')
    }
  }

  private checkForAttachments(payload: any): boolean {
    if (!payload) return false
    
    if (payload.parts) {
      return payload.parts.some((part: any) => 
        part.filename && part.body?.attachmentId
      )
    }
    
    return false
  }

  async searchSupplierEmails() {
    // Search for emails that might contain invoices or purchase orders
    const queries = [
      'has:attachment (invoice OR purchase order OR PO)',
      'subject:(invoice OR "purchase order" OR quotation)',
      'from:(supplier OR vendor) has:attachment'
    ]
    
    const results = []
    for (const query of queries) {
      try {
        const emails = await this.listEmails(5, query)
        results.push(...emails)
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error)
      }
    }
    
    // Remove duplicates
    const uniqueResults = results.filter((email, index, self) =>
      index === self.findIndex((e) => e.id === email.id)
    )
    
    return uniqueResults
  }
  
  private async verifyScopes() {
    try {
      // Get the access token to check scopes
      const tokenInfo = await this.oauth2Client.getAccessToken()
      if (tokenInfo.token) {
        // Decode the JWT to see the scopes
        const payload = tokenInfo.token.split('.')[1]
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
        console.log('OAuth token scopes:', decoded.scope)
        
        // Check if we have the required scopes
        const requiredScopes = [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send'
        ]
        
        const hasScopes = decoded.scope ? decoded.scope.split(' ') : []
        const missingScopes = requiredScopes.filter(scope => !hasScopes.includes(scope))
        
        if (missingScopes.length > 0) {
          console.warn('Missing required Gmail scopes:', missingScopes)
          console.warn('Current scopes:', hasScopes)
        }
      }
    } catch (error) {
      console.error('Failed to verify OAuth scopes:', error)
    }
  }
}

// Singleton instance
let gmailService: GmailService | null = null

export function getGmailService(): GmailService {
  if (!gmailService) {
    gmailService = new GmailService()
  }
  return gmailService
}