# Multi-Tenant Email Architecture for ERP

## Current Limitation
- Single OAuth token = Single email account
- Not scalable for multiple companies/users

## Recommended Solutions

### Solution 1: Google Workspace Domain-Wide Delegation (BEST for Enterprise)

**How it works:**
- One service account can access ALL emails in your Google Workspace domain
- No need for individual OAuth tokens per user
- Admin grants access once for entire organization

**Implementation:**
1. Create a Google Service Account
2. Enable domain-wide delegation
3. Admin authorizes the service account for Gmail scopes
4. Use service account to impersonate any user in the domain

**Benefits:**
- ✅ Access any user's email in the organization
- ✅ No OAuth flow needed per user
- ✅ Centralized management
- ✅ Perfect for ERP systems

### Solution 2: OAuth Per Company/User (Current Approach Enhanced)

**Database Schema Update:**
```sql
-- Add to Company or User table
CREATE TABLE email_credentials (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  email_address VARCHAR(255) NOT NULL,
  google_refresh_token TEXT,
  microsoft_refresh_token TEXT,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'imap'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**OAuth Flow in App:**
1. Company admin connects their email
2. Redirect to Google OAuth
3. Store refresh token in database
4. Each company uses their own credentials

### Solution 3: Shared ERP Email Account (Simplest)

**How it works:**
- Create `erp@yourcompany.com` Gmail account
- All companies CC this email on important documents
- ERP reads from this single inbox
- Use labels/filters to organize by company

**Benefits:**
- ✅ Simple implementation
- ✅ No complex OAuth per user
- ✅ Central repository of all documents

### Solution 4: Email Forwarding Rules

**How it works:**
- Each company sets up forwarding rules
- Forward specific emails (invoices, POs) to `erp+companyname@yourcompany.com`
- Gmail plus addressing to identify company
- Parse and process centrally

## Recommended Implementation Plan

### Phase 1: Enhanced OAuth Per Company
```typescript
// Modified Gmail Service
export class GmailService {
  private credentials: Map<string, OAuth2Client> = new Map()
  
  async getClient(companyId: string): Promise<OAuth2Client> {
    // Check cache
    if (this.credentials.has(companyId)) {
      return this.credentials.get(companyId)!
    }
    
    // Load from database
    const creds = await prisma.emailCredentials.findFirst({
      where: { company_id: companyId }
    })
    
    if (!creds) {
      throw new Error('No email credentials for company')
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      refresh_token: creds.google_refresh_token
    })
    
    this.credentials.set(companyId, oauth2Client)
    return oauth2Client
  }
  
  async listEmails(companyId: string, maxResults: number) {
    const client = await this.getClient(companyId)
    const gmail = google.gmail({ version: 'v1', auth: client })
    // ... rest of implementation
  }
}
```

### Phase 2: Add OAuth Connection UI
```typescript
// New route for OAuth connection
app.get('/api/companies/:id/connect-email', async (c) => {
  const companyId = c.req.param('id')
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state: companyId // Pass company ID through OAuth flow
  })
  
  return c.redirect(authUrl)
})

app.get('/api/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const companyId = c.req.query('state')
  
  const { tokens } = await oauth2Client.getToken(code)
  
  // Save to database
  await prisma.emailCredentials.create({
    data: {
      company_id: companyId,
      email_address: tokens.email,
      google_refresh_token: tokens.refresh_token,
      provider: 'google'
    }
  })
  
  return c.redirect('/settings?connected=true')
})
```

### Phase 3: Service Account (If you have Google Workspace)
```typescript
// Service account approach
import { JWT } from 'google-auth-library'

export class WorkspaceGmailService {
  private jwt: JWT
  
  constructor() {
    this.jwt = new JWT({
      email: process.env.SERVICE_ACCOUNT_EMAIL,
      key: process.env.SERVICE_ACCOUNT_KEY,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    })
  }
  
  async listEmailsForUser(userEmail: string) {
    // Impersonate the user
    this.jwt.subject = userEmail
    
    const gmail = google.gmail({ version: 'v1', auth: this.jwt })
    return gmail.users.messages.list({ userId: 'me' })
  }
}
```

## Decision Matrix

| Solution | Setup Complexity | Scalability | Security | Best For |
|----------|-----------------|-------------|----------|----------|
| Domain-Wide Delegation | High | Excellent | High | Large enterprises with Google Workspace |
| OAuth Per Company | Medium | Good | Medium | Multi-tenant SaaS |
| Shared ERP Email | Low | Poor | Low | Small deployments |
| Email Forwarding | Low | Medium | Medium | Quick implementation |

## Recommended Approach for Your ERP

Given that you have multiple work emails in Gmail:

1. **Start with OAuth Per Company** (Phase 1)
   - Add email credentials table
   - Build OAuth connection flow
   - Store tokens per company

2. **Consider Domain-Wide Delegation** (Phase 3)
   - If all emails are in same Google Workspace domain
   - Much better for enterprise deployment
   - One-time setup by admin

3. **Add Email Forwarding** as backup
   - For companies that can't use OAuth
   - Simple rule-based forwarding

Would you like me to implement the multi-tenant OAuth solution?