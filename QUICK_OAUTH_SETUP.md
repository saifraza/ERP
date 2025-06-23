# Quick Gmail OAuth Setup for ERP

Since your OAuth client no longer exists, you need to create new credentials.

## Step 1: Create OAuth App (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "ERP-Gmail-Integration"
3. Enable Gmail API:
   - Click "Enable APIs and Services"
   - Search "Gmail API"
   - Click Enable

## Step 2: Create OAuth Credentials (5 minutes)

1. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
2. Configure consent screen:
   - User Type: External
   - App name: ERP Gmail Integration
   - User support email: your-email
   - Skip everything else for now
3. Create OAuth client:
   - Type: Web application
   - Name: ERP Cloud API
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
4. Save Client ID and Secret

## Step 3: Get Refresh Token (2 minutes)

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click settings (gear icon) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Secret
4. In Step 1, select:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Click "Authorize APIs" and login
6. Click "Exchange authorization code for tokens"
7. Copy the Refresh Token

## Step 4: Update Railway (1 minute)

Add to your cloud-api service in Railway:

```json
{
  "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
  "JWT_SECRET": "5WnoUWSdmFHvHdNI/BHh66Erc0feyawHFi88t/qBiSk=",
  "GOOGLE_CLIENT_ID": "your-new-client-id",
  "GOOGLE_CLIENT_SECRET": "your-new-secret",
  "GOOGLE_REFRESH_TOKEN": "your-new-refresh-token"
}
```

## That's it!

Railway will redeploy and your Gmail integration will work.

## Important Notes:

- Use the Google account whose emails you want to access
- The OAuth playground method is the fastest way to get a refresh token
- The refresh token won't expire unless unused for 6 months
- You can add more users later in Google Cloud Console