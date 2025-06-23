import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export class GmailService {
  private oauth2Client: OAuth2Client
  private gmail: any
  private calendar: any

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Gmail OAuth credentials not configured')
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async listEmails(maxResults: number = 10, query?: string) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || ''
      })

      const messages = response.data.messages || []
      
      // Get full details for each message
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id
          })
          
          const headers = detail.data.payload?.headers || []
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
          const date = headers.find((h: any) => h.name === 'Date')?.value || ''
          
          // Check for attachments
          const hasAttachments = this.checkForAttachments(detail.data.payload)
          
          return {
            id: msg.id,
            subject,
            from,
            date,
            hasAttachments,
            snippet: detail.data.snippet
          }
        })
      )

      return emailDetails
    } catch (error) {
      console.error('Gmail list error:', error)
      throw new Error('Failed to fetch emails')
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
}

// Singleton instance
let gmailService: GmailService | null = null

export function getGmailService(): GmailService {
  if (!gmailService) {
    gmailService = new GmailService()
  }
  return gmailService
}