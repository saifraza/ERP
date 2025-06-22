# Gmail API Setup Guide

## 1. Enable Gmail API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on it and press **ENABLE**

## 2. Create Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - Choose "Internal" (if using workspace) or "External"
   - Fill in required fields (app name, email, etc.)
   - Add scopes: 
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`

## 3. Create OAuth Client ID

1. Application type: **Web application**
2. Name: "ERP MCP Server"
3. Authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://mcp-server-production-ac21.up.railway.app/auth/callback`

## 4. Download Credentials

1. Click on your newly created OAuth client
2. Click **DOWNLOAD JSON**
3. Save as `credentials.json`

## 5. Environment Variables Needed

```bash
# Gmail OAuth2 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://mcp-server-production-ac21.up.railway.app/auth/callback

# Gmail User (your factory email)
GMAIL_USER=your-factory@gmail.com
```

## 6. Add to Railway

1. Go to your MCP server service in Railway
2. Go to Variables tab
3. Add the above environment variables
4. Railway will auto-redeploy

## Required Scopes for ERP

- `gmail.readonly` - Read emails and attachments
- `gmail.send` - Send emails with documents
- `gmail.modify` - Mark emails as processed

## Next Steps

After setup, the MCP server can:
- Send invoices/POs to clients
- Read incoming emails with attachments
- Extract documents from emails automatically
- Link email communications to documents