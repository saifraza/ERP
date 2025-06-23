# OAuth Setup for MSPIL ERP System

## Organization Details
- **Company**: Mahakaushal Sugar and Power Industries Ltd.
- **Domain**: mspil.in
- **OAuth Type**: Internal (Google Workspace)
- **Project**: ERP mspil

## OAuth Credentials
- **Client ID**: `186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com`
- **Client Secret**: *(Get from Google Cloud Console or IT administrator)*
- **Authorized Domain**: `@mspil.in` accounts only

## Setup Locations

### 1. MCP Server OAuth Setup
- **Location**: `/packages/mcp-server/OAUTH_SETUP_GUIDE.md`
- **Purpose**: Gmail integration for AI features
- **Config File**: `/packages/mcp-server/credentials.json`

### 2. Cloud API OAuth
- **Environment Variables** (Railway):
  ```
  GOOGLE_CLIENT_ID=186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=<get-from-console>
  GOOGLE_REFRESH_TOKEN=<generate-using-script>
  ```

### 3. Production Redirect URIs
Add these to Google Cloud Console:
- `http://localhost:4100/code` (local development)
- `https://backend-api-production-5e68.up.railway.app/api/email-oauth/callback` (production)

## Quick Setup Steps

1. **Get Client Secret**:
   - Login to [Google Cloud Console](https://console.cloud.google.com)
   - Select "ERP mspil" project
   - Go to Credentials → OAuth 2.0 Client IDs
   - Copy the client secret

2. **Update Local Config**:
   ```bash
   cd packages/mcp-server
   # Update credentials.json with client_secret
   ```

3. **Generate Refresh Token**:
   ```bash
   node get-refresh-token.js
   # This will open browser for authorization
   # Copy the refresh token
   ```

4. **Update Railway Environment**:
   - Go to Railway dashboard
   - Update environment variables for all services
   - Restart services

## Security Guidelines
- Never commit credentials to version control
- Use environment variables for production
- Restrict OAuth to @mspil.in domain only
- Rotate refresh tokens periodically
- Monitor OAuth usage in Google Cloud Console

## Support
For OAuth issues, contact:
- IT Department: it@mspil.in
- Admin: admin@mspil.in