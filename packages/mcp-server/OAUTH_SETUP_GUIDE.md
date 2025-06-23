# Google OAuth Setup Guide for MSPIL ERP System
## Mahakaushal Sugar and Power Industries Ltd. (mspil.in)

## Important Information
- **Organization**: Mahakaushal Sugar and Power Industries Ltd.
- **Domain**: mspil.in
- **OAuth Type**: Internal (Google Workspace)
- **Client ID**: 186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com
- **Project Name**: ERP mspil

## Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Make sure you're logged in with your @mspil.in Google Workspace account

## Step 2: Select the Project
1. Click the project dropdown at the top
2. Select "ERP mspil" project
3. If creating new, use naming convention: "ERP-mspil-[module]"

## Step 3: Enable Required APIs
1. Click the hamburger menu (☰) → "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Gmail API** - Click and press "ENABLE"
   - **Google Calendar API** - Click and press "ENABLE"

## Step 4: Create OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose User Type:
   - **Internal** (Selected for mspil.in Google Workspace)
3. Click "CREATE"
4. Fill in:
   - App name: "MSPIL ERP System"
   - User support email: admin@mspil.in
   - Developer contact: it@mspil.in
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
4. Name: "MSPIL ERP OAuth Client"
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
The credentials.json file should contain:
```json
{
    "web": {
        "client_id": "186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com",
        "client_secret": "YOUR_ACTUAL_CLIENT_SECRET",
        "redirect_uris": ["http://localhost:4100/code"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "project_id": "erp-mspil"
    }
}
```

**Note**: Get the client_secret from your Google Cloud Console or IT administrator.

## Common Issues:
- If you don't see "Credentials" menu, make sure APIs are enabled first
- Since this is an "Internal" app for mspil.in, only @mspil.in accounts can authenticate
- The redirect URI must match exactly (including http:// part)
- For production deployment, add: `https://backend-api-production-5e68.up.railway.app/api/email-oauth/callback`

## Next Steps:
1. Get the client_secret from Google Cloud Console
2. Update credentials.json with the client_secret
3. Generate refresh token:
```bash
cd packages/mcp-server
node get-refresh-token.js
```
4. Update Railway environment variables:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_REFRESH_TOKEN

## Security Notes:
- Never commit credentials.json with the client_secret to version control
- Store OAuth credentials securely in environment variables
- Restrict access to @mspil.in domain users only
- Regularly rotate refresh tokens for security