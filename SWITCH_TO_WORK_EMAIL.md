# Switch Gmail Integration to Work Email

## Current Situation
- Currently authenticated for: `saifraza9@gmail.com` (personal)
- Want to switch to: `saifraza@mspil.in` (work email)

## Steps to Switch

### Option 1: If mspil.in uses Google Workspace

1. **Use the same OAuth app** (ERP MCP Server)
   - The same OAuth app can work with multiple Google accounts

2. **Generate new refresh token for work email**:

   a. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
   
   b. Click settings (gear icon) → "Use your own OAuth credentials"
   
   c. Enter your current credentials:
   - Client ID: `28199401937-n4no1r0opkhgkv5rpv29a1eehm0r8eel.apps.googleusercontent.com`
   - Client Secret: (your current secret)
   
   d. Select these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.metadata`
   
   e. Click "Authorize APIs"
   
   f. **IMPORTANT**: Sign in with `saifraza@mspil.in` (not your personal Gmail)
   
   g. Click "Exchange authorization code for tokens"
   
   h. Copy the new refresh token

3. **Update Railway environment variables**:
   - Keep the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Replace `GOOGLE_REFRESH_TOKEN` with the new token from step 2

### Option 2: If mspil.in doesn't use Google Workspace

If your work email doesn't use Google's infrastructure, you'll need a different approach:

1. **Set up email forwarding** from work to personal Gmail
2. **Use IMAP/SMTP integration** instead of Gmail API
3. **Use Microsoft Graph API** if mspil.in uses Office 365

## Quick Test After Switching

```bash
# Test with new credentials
./test-gmail-api.sh

# Should show:
# gmail_details: {
#   "email": "saifraza@mspil.in",
#   ...
# }
```

## Important Notes

- The OAuth app (ERP MCP Server) can be used with any Google account
- Each account needs its own refresh token
- Make sure to authorize with the correct account when generating the token
- The work email must have Gmail API access enabled (usually automatic for Google Workspace)

## Troubleshooting

If you get errors after switching:

1. **"Invalid grant"**: The refresh token is for the wrong account
2. **"Access denied"**: The work domain might have restrictions
3. **"Scope not authorized"**: Admin might need to approve Gmail API access

Let me know which option applies to your work email!