# Fix Gmail OAuth Integration

## Current Situation
- OAuth credentials are configured for: `saifraza@mspil.in`
- Getting `invalid_client` error
- This means the OAuth app or credentials have an issue

## Option 1: Fix Existing OAuth (If you have access to saifraza@mspil.in)

1. **Verify the OAuth App Exists**
   - Login to [Google Cloud Console](https://console.cloud.google.com/) with the account that created the OAuth app
   - Look for project with Client ID: `51638055315-e9b0ecnqp1jdtnfcbu2cmqk28bkvgdld`
   - Check if Gmail API is enabled

2. **Re-authorize if needed**
   - The refresh token might have expired
   - You may need to generate a new refresh token

## Option 2: Create New OAuth Credentials (Recommended)

### Step 1: Create OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "ERP-Gmail")
3. Enable Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click Enable

### Step 2: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen first:
   - User Type: External
   - App name: "ERP Gmail Integration"
   - User support email: Your email
   - Authorized domains: Add `up.railway.app`
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar`

4. Create OAuth client:
   - Application type: "Web application"
   - Name: "ERP Cloud API"
   - Authorized redirect URIs: Add `http://localhost:3000/oauth2callback`

5. Save the Client ID and Client Secret

### Step 3: Generate Refresh Token

Create this Node.js script locally:

```javascript
// save as generate-token.js
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/oauth2callback'
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nYour tokens:');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\nAdd these to Railway environment variables:');
    console.log(`GOOGLE_CLIENT_ID=${oauth2Client._clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET=${oauth2Client._clientSecret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (error) {
    console.error('Error retrieving access token', error);
  }
  rl.close();
});
```

Run it:
```bash
npm install googleapis
node generate-token.js
```

### Step 4: Update Railway Variables

Add the new credentials to your cloud-api service in Railway:
- `GOOGLE_CLIENT_ID`: Your new client ID
- `GOOGLE_CLIENT_SECRET`: Your new client secret  
- `GOOGLE_REFRESH_TOKEN`: The generated refresh token

## Testing

After updating credentials and Railway redeploys:

1. Check health endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://cloud-api-production-0f4d.up.railway.app/api/mcp/health
```

Should show: `"gmail_status": "connected"`

2. Test email listing:
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/list-emails \
  -d '{"maxResults": 5}'
```

## Important Notes

- The Gmail integration will access emails from the Google account used to generate the refresh token
- Make sure to use the Google account you want the ERP to access
- The OAuth app needs to be in production or have the test user added
- Refresh tokens don't expire unless revoked or unused for 6 months