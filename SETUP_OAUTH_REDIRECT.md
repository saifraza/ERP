# Setup OAuth Redirect URI

## Current Issue
The OAuth connection is failing because the redirect URI needs to be added to your Google OAuth app.

## Steps to Fix

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (where you created the OAuth app)

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID (ERP MCP Server)
   - Click on it to edit

3. **Add Redirect URI**
   Add this exact URI to "Authorized redirect URIs":
   ```
   https://cloud-api-production-0f4d.up.railway.app/api/email-oauth/callback
   ```

4. **Save Changes**
   - Click "Save" at the bottom
   - Changes take effect immediately

## Why This Is Needed
Google OAuth requires pre-registered redirect URIs for security. After OAuth authorization, Google redirects users back to this URL with the authorization code.

## Testing
After adding the redirect URI, the "Connect Email Account" button should:
1. Redirect to Google sign-in
2. Ask for Gmail permissions
3. Redirect back to your app
4. Store the credentials

## Current OAuth App Details
- Client ID: `28199401937-n4no1r0opkhgkv5rpv29a1eehm0r8eel.apps.googleusercontent.com`
- Redirect URI: `https://cloud-api-production-0f4d.up.railway.app/api/email-oauth/callback`

## Alternative: Create New OAuth App
If you can't access the existing OAuth app, create a new one:

1. Create new OAuth 2.0 Client ID
2. Set application type: "Web application"
3. Add redirect URI (above)
4. Update Railway environment variables with new credentials