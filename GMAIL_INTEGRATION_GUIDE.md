# Gmail Integration for ERP System

## Overview
This guide explains the robust Gmail integration solution for your ERP system. Instead of relying on the MCP server protocol (which is designed for AI assistants), we've implemented direct Gmail API integration in your cloud-api for better reliability and performance.

## Architecture Decision

### Why Direct Gmail API?
1. **Reliability**: Direct API calls are more stable than MCP stdio protocol
2. **Performance**: No protocol translation overhead
3. **Scalability**: Can handle multiple concurrent requests
4. **Maintainability**: Standard REST API is easier to debug
5. **Integration**: Works seamlessly with your existing API

### Solution Architecture
```
Frontend (React) 
    ↓ HTTPS
Cloud API (Hono)
    ↓ OAuth2
Gmail API / Calendar API
```

## Setup Instructions

### 1. Add Gmail OAuth to Cloud API

In Railway, go to your **cloud-api** service and add these environment variables:

```json
{
  "GOOGLE_CLIENT_ID": "your-client-id-from-mcp-server",
  "GOOGLE_CLIENT_SECRET": "your-client-secret-from-mcp-server",
  "GOOGLE_REFRESH_TOKEN": "your-refresh-token-from-mcp-server"
}
```

**Note**: Copy these values from your MCP server environment variables in Railway.

### 2. Available Endpoints

Once deployed, your Gmail integration provides these endpoints:

#### List Emails
```bash
POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/list-emails
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "maxResults": 20,
  "query": "is:unread"
}
```

#### Send Email
```bash
POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/send-email
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test from ERP",
  "body": "<h1>Hello</h1><p>This is a test email</p>",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

#### List Calendar Events
```bash
POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/list-events
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "maxResults": 10
}
```

#### Search Supplier Emails
```bash
POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/search-suppliers
Authorization: Bearer YOUR_TOKEN
```

#### Extract Attachments
```bash
POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/extract-attachments
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "messageId": "18abc123def456"
}
```

## Features

### 1. Email Management
- List emails with pagination
- Search with Gmail query syntax
- Send HTML emails with attachments
- Extract and process attachments

### 2. Calendar Integration
- View upcoming events
- Create and update events
- Set reminders

### 3. Document Processing
- Automatic detection of invoices, POs
- Extract attachments from emails
- Store documents in ERP system

### 4. Smart Search
- Find supplier emails
- Search for specific document types
- Filter by date, sender, attachments

## Using in the ERP

### From the Mails Page
1. Navigate to **Mails** in the sidebar
2. Click "Fetch Emails" to load your Gmail messages
3. Use search to find specific emails
4. Click "Send Test" to verify sending

### From AI Chat
Type commands like:
- "Show my emails"
- "Search for invoices"
- "Send email to supplier"

### Programmatically
```javascript
// In your React components
const fetchEmails = async () => {
  const response = await fetch(`${API_URL}/api/mcp/gmail/list-emails`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ maxResults: 20 })
  });
  
  const data = await response.json();
  console.log(data.data); // Array of emails
};
```

## Benefits for ERP

1. **Automated Document Capture**: Invoices and POs from email automatically imported
2. **Vendor Communication**: Send and track emails within ERP
3. **Calendar Integration**: Schedule deliveries, meetings, maintenance
4. **Audit Trail**: All email communications logged
5. **Search**: Find any document or communication instantly

## Troubleshooting

### "Gmail service not configured"
- Check OAuth credentials in Railway environment variables
- Ensure all three values are set (CLIENT_ID, SECRET, REFRESH_TOKEN)

### No emails showing
- Check if the Gmail account has emails
- Verify the OAuth token has proper scopes
- Check Railway logs for errors

### Cannot send emails
- Verify sender permissions in Gmail
- Check email format (valid addresses)
- Review Gmail sending limits

## Security

- OAuth tokens are stored securely in environment variables
- All requests require authentication
- Refresh tokens auto-renew access
- No passwords stored

## Next Steps

1. **Set environment variables** in cloud-api on Railway
2. **Wait for redeploy** (2-3 minutes)
3. **Test in Mails page** - you should see real emails!
4. **Enable document processing** workflows

This direct integration approach gives you a production-ready Gmail system that scales with your ERP needs.