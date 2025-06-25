import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../lib/prisma.js'

export class MultiTenantGmailService {
  private clients: Map<string, OAuth2Client> = new Map()
  
  /**
   * Get OAuth client for a specific company or user
   */
  async getClient(companyId?: string, userId?: string): Promise<{
    client: OAuth2Client,
    email: string
  }> {
    const cacheKey = companyId || userId || 'default'
    
    // Check cache
    if (this.clients.has(cacheKey)) {
      const client = this.clients.get(cacheKey)!
      // Get email from database
      const cred = await this.getCredentials(companyId, userId)
      return { client, email: cred.emailAddress }
    }
    
    // Load credentials from database
    const credentials = await this.getCredentials(companyId, userId)
    
    if (!credentials.googleRefreshToken) {
      throw new Error(`No Google refresh token for ${credentials.emailAddress}`)
    }
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.')
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      refresh_token: credentials.googleRefreshToken
    })
    
    // Cache the client
    this.clients.set(cacheKey, oauth2Client)
    
    return { client: oauth2Client, email: credentials.emailAddress }
  }
  
  /**
   * Get credentials from database or use default
   */
  private async getCredentials(companyId?: string, userId?: string) {
    // If specific company/user requested, fetch from database
    if (companyId || userId) {
      const cred = await prisma.emailCredential.findFirst({
        where: {
          AND: [
            companyId ? { companyId } : {},
            userId ? { userId } : {},
            { provider: 'google' },
            { isActive: true }
          ]
        }
      })
      
      if (cred) return cred
    }
    
    // Fall back to environment variable (current approach)
    // Don't show default@erp.com in the UI
    return {
      emailAddress: process.env.GOOGLE_USER_EMAIL || 'saifraza@mspil.in',
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      provider: 'google'
    }
  }
  
  /**
   * List emails for a specific company
   */
  async listEmails(
    companyId: string | undefined,
    maxResults: number = 10,
    query?: string
  ) {
    const { client, email } = await this.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    console.log(`Listing emails for ${email} (company: ${companyId || 'default'})`)
    console.log(`Query: ${query}, MaxResults: ${maxResults}`)
    
    try {
      // With gmail.readonly scope, we can use query parameters
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults || 10,
        q: query || '' // Enable query parameter with full read scope
      })
      
      const messages = response.data.messages || []
      
      if (messages.length === 0) {
        return []
      }
      
      // Get message details
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date', 'To']
            })
            
            const headers = detail.data.payload?.headers || []
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const date = headers.find((h: any) => h.name === 'Date')?.value || ''
            const to = headers.find((h: any) => h.name === 'To')?.value || ''
            
            return {
              id: msg.id,
              threadId: msg.threadId,
              subject,
              from,
              to,
              date,
              snippet: detail.data.snippet || '',
              account: email // Include which account this came from
            }
          } catch (error) {
            console.error(`Failed to get details for message ${msg.id}:`, error)
            return null
          }
        })
      )
      
      // Filter out any failed messages
      return emailDetails.filter(email => email !== null)
      
    } catch (error: any) {
      console.error(`Gmail list error for ${email}:`, error)
      throw new Error(`Failed to list emails for ${email}: ${error?.message}`)
    }
  }
  
  /**
   * Get full email content
   */
  async getEmailContent(
    companyId: string | undefined,
    messageId: string
  ) {
    const { client, email } = await this.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    console.log(`Getting full email content for ${messageId} from ${email}`)
    
    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })
      
      const message = response.data
      const payload = message.payload
      
      // Extract headers
      const headers = payload?.headers || []
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
      const to = headers.find((h: any) => h.name === 'To')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''
      
      // Extract body
      let textBody = ''
      let htmlBody = ''
      
      const extractBody = (parts: any[]): void => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            textBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
          } else if (part.parts) {
            extractBody(part.parts)
          }
        }
      }
      
      if (payload?.parts) {
        extractBody(payload.parts)
      } else if (payload?.body?.data) {
        const body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
        if (payload.mimeType === 'text/html') {
          htmlBody = body
        } else {
          textBody = body
        }
      }
      
      // Extract attachments info
      const attachments: any[] = []
      const extractAttachments = (parts: any[]): void => {
        for (const part of parts) {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
              attachmentId: part.body.attachmentId
            })
          }
          if (part.parts) {
            extractAttachments(part.parts)
          }
        }
      }
      
      if (payload?.parts) {
        extractAttachments(payload.parts)
      }
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        snippet: message.snippet,
        textBody,
        htmlBody,
        attachments,
        labels: message.labelIds || [],
        account: email
      }
      
    } catch (error: any) {
      console.error(`Failed to get email content for ${messageId}:`, error)
      throw new Error(`Failed to get email content: ${error?.message}`)
    }
  }
  
  /**
   * Send email from a specific company account
   */
  async sendEmail(
    companyId: string | undefined,
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ) {
    const { client, email } = await this.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    console.log(`Sending email from ${email} to ${to}`)
    
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `From: ${email}`,
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
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })
    
    return {
      success: true,
      messageId: response.data.id,
      message: `Email sent successfully from ${email}`,
      account: email
    }
  }

  /**
   * Send email with attachments from a specific company account
   */
  async sendEmailWithAttachment(
    companyId: string | undefined,
    to: string,
    subject: string,
    body: string,
    attachments: Array<{
      filename: string,
      content: Buffer,
      contentType: string
    }>,
    cc?: string,
    bcc?: string
  ) {
    const { client, email } = await this.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    
    console.log(`Sending email with ${attachments.length} attachment(s) from ${email} to ${to}`)
    
    // Create a multipart message with proper MIME formatting
    const boundary = `boundary_${Date.now()}`
    const nl = '\r\n' // Use CRLF for proper email formatting
    const messageParts = []
    
    // Email headers
    messageParts.push(
      'MIME-Version: 1.0',
      `From: ${email}`,
      `To: ${to}`
    )
    
    if (cc) messageParts.push(`Cc: ${cc}`)
    if (bcc) messageParts.push(`Bcc: ${bcc}`)
    
    messageParts.push(
      `Subject: ${subject}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '', // Empty line after headers
      `--${boundary}`
    )
    
    // Email body part
    messageParts.push(
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '', // Empty line before content
      body,
      '', // Empty line after content
      `--${boundary}`
    )
    
    // Add attachments with proper formatting
    for (const attachment of attachments) {
      // Ensure base64 content is properly chunked (76 chars per line)
      const base64Content = attachment.content.toString('base64')
      const chunkedBase64 = base64Content.match(/.{1,76}/g) || []
      
      messageParts.push(
        `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        'Content-Transfer-Encoding: base64',
        '', // Empty line before content
        ...chunkedBase64, // Spread chunked base64 content
        '', // Empty line after content
        `--${boundary}`
      )
    }
    
    // Remove last boundary and add closing boundary
    messageParts[messageParts.length - 1] = `--${boundary}--`
    
    // Join with CRLF and encode
    const message = messageParts.join(nl)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })
    
    return {
      success: true,
      messageId: response.data.id,
      message: `Email with attachments sent successfully from ${email}`,
      account: email
    }
  }
  
  /**
   * Encode string as quoted-printable
   */
  private encodeQuotedPrintable(str: string): string {
    // Replace non-ASCII characters and special characters
    return str
      .replace(/([^\x20-\x7E])/g, (match) => {
        return '=' + match.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
      })
      .replace(/([=])/g, '=3D')
      // Ensure lines don't exceed 76 characters
      .replace(/(.{1,72})/g, '$1=\r\n')
      .replace(/=\r\n$/, '') // Remove trailing soft line break
  }
  
  /**
   * Store OAuth credentials for a company
   */
  async storeCredentials(
    companyId: string,
    emailAddress: string,
    refreshToken: string,
    provider: 'google' | 'microsoft' = 'google'
  ) {
    // Check if credentials already exist
    const existing = await prisma.emailCredential.findUnique({
      where: { emailAddress }
    })
    
    if (existing) {
      // Update existing
      return await prisma.emailCredential.update({
        where: { id: existing.id },
        data: {
          companyId,
          googleRefreshToken: provider === 'google' ? refreshToken : undefined,
          microsoftRefreshToken: provider === 'microsoft' ? refreshToken : undefined,
          isActive: true,
          lastSynced: new Date()
        }
      })
    }
    
    // Create new
    return await prisma.emailCredential.create({
      data: {
        companyId,
        emailAddress,
        googleRefreshToken: provider === 'google' ? refreshToken : undefined,
        microsoftRefreshToken: provider === 'microsoft' ? refreshToken : undefined,
        provider,
        isActive: true
      }
    })
  }
  
  /**
   * List all email accounts for a company
   */
  async listEmailAccounts(companyId: string) {
    return await prisma.emailCredential.findMany({
      where: {
        companyId,
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
  }
  
  /**
   * Remove email account
   */
  async removeEmailAccount(companyId: string, emailAddress: string) {
    return await prisma.emailCredential.updateMany({
      where: {
        companyId,
        emailAddress
      },
      data: {
        isActive: false
      }
    })
  }
  
  /**
   * List calendar events for a specific company account
   */
  async listCalendarEvents(
    companyId: string | undefined,
    maxResults: number = 10
  ) {
    const { client, email } = await this.getClient(companyId)
    const calendar = google.calendar({ version: 'v3', auth: client })
    
    console.log(`Listing calendar events for ${email} (company: ${companyId || 'default'})`)
    
    try {
      const response = await calendar.events.list({
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
        description: event.description,
        account: email // Include which account this came from
      }))
      
      return events
    } catch (error: any) {
      console.error(`Calendar list error for ${email}:`, error)
      throw new Error(`Failed to list calendar events for ${email}: ${error?.message}`)
    }
  }
}

// Export singleton instance
export const multiTenantGmail = new MultiTenantGmailService()