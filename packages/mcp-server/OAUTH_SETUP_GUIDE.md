# Google OAuth Setup Guide for Gmail MCP Server

## Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Make sure you're logged in with your Gmail account

## Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project" or select existing one
3. Name it: "ERP Factory System"

## Step 3: Enable Required APIs
1. Click the hamburger menu (☰) → "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Gmail API** - Click and press "ENABLE"
   - **Google Calendar API** - Click and press "ENABLE"

## Step 4: Create OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose User Type:
   - **Internal** (if using Google Workspace)
   - **External** (if using personal Gmail)
3. Click "CREATE"
4. Fill in:
   - App name: "ERP Factory MCP Server"
   - User support email: (your email)
   - Developer contact: (your email)
5. Click "SAVE AND CONTINUE"
6. On Scopes page, click "ADD OR REMOVE SCOPES"
7. Search and select these scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/calendar`
8. Click "UPDATE" then "SAVE AND CONTINUE"
9. Add test users (your email) if External
10. Click "SAVE AND CONTINUE"

## Step 5: Create OAuth 2.0 Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: "ERP MCP Server"
5. Authorized redirect URIs - Add:
   - `http://localhost:4100/code`
   - `http://localhost:3000/oauth2callback`
6. Click "CREATE"

## Step 6: Download Credentials
1. You'll see a popup with Client ID and Secret
2. Click "DOWNLOAD JSON" button
3. Or copy:
   - Client ID: (looks like: 123456789-abcdef.apps.googleusercontent.com)
   - Client Secret: (looks like: GOCSPX-xxxxxxxxxxxxx)

## Step 7: Update credentials.json
Replace the content with your actual values:
```json
{
    "web": {
        "client_id": "YOUR_ACTUAL_CLIENT_ID",
        "client_secret": "YOUR_ACTUAL_CLIENT_SECRET",
        "redirect_uris": ["http://localhost:4100/code"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
}
```

## Common Issues:
- If you don't see "Credentials" menu, make sure APIs are enabled first
- For "External" apps, you may need to add your email as a test user
- The redirect URI must match exactly (including http:// part)

## Next Steps:
After updating credentials.json:
```bash
cd packages/mcp-server
node get-refresh-token.js
```