# Update OAuth Credentials for ERP

## Current Situation
- You found the correct OAuth app: "ERP MCP Server"
- Client ID: `28199401937-n4no1r0opkhgkv5rpv29a1eehm0r8eel.apps.googleusercontent.com`
- The old client ID in Railway is incorrect/deleted

## Steps to Fix

### 1. Get the Client Secret
In Google Cloud Console:
1. Go to your OAuth 2.0 Client ID "ERP MCP Server"
2. Copy the Client Secret (it might be hidden, click show)

### 2. Generate New Refresh Token (if needed)

If your current refresh token doesn't work with the new client ID:

**Option A: Using OAuth Playground (Easiest)**
1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click settings (gear) → "Use your own OAuth credentials"
3. Enter:
   - Client ID: `28199401937-n4no1r0opkhgkv5rpv29a1eehm0r8eel.apps.googleusercontent.com`
   - Client Secret: (from step 1)
4. Authorize Gmail scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Get the refresh token

**Option B: Test with existing refresh token**
Try using your existing refresh token with the new client ID first.

### 3. Update Railway Environment Variables

Replace ALL the Google OAuth variables in your cloud-api service:

```json
{
  "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
  "JWT_SECRET": "5WnoUWSdmFHvHdNI/BHh66Erc0feyawHFi88t/qBiSk=",
  "GOOGLE_CLIENT_ID": "28199401937-n4no1r0opkhgkv5rpv29a1eehm0r8eel.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "your-client-secret-here",
  "GOOGLE_REFRESH_TOKEN": "your-refresh-token-here"
}
```

### 4. Verify Setup

After Railway redeploys, test:

```bash
# Get token
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saif@erp.com","password":"1234"}' | jq -r '.token')

# Check health
curl -s https://cloud-api-production-0f4d.up.railway.app/api/mcp/health \
  -H "Authorization: Bearer $TOKEN" | jq
```

Should show: `"gmail_status": "connected"`

## Important Notes

- Make sure to add `https://developers.google.com/oauthplayground` to your OAuth app's authorized redirect URIs
- The refresh token should work if it was generated with the same client ID
- If you still get errors, generate a fresh refresh token using the OAuth Playground method