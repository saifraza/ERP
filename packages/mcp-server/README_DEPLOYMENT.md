# Deployment Instructions for Gmail MCP Server

## Environment Variables for Railway

Add these variables in Railway dashboard for the mcp-server service:

1. Go to your Railway project
2. Click on the mcp-server service
3. Go to Variables tab
4. Add these environment variables:

```
GOOGLE_CLIENT_ID=(your client id from Google Cloud Console)
GOOGLE_CLIENT_SECRET=(your client secret from Google Cloud Console)
GOOGLE_REFRESH_TOKEN=(your refresh token from token.json)
ERP_API_URL=https://backend-api-production-5e68.up.railway.app
RAILWAY_CONFIG_ROOT=packages/mcp-server
```

## Important: Keep Secrets Secure

- Never commit credentials.json or token.json to git
- Store all secrets as environment variables in Railway
- Use the .gitignore file to prevent accidental commits

## Local Testing

Create a .env file locally (do not commit):
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
ERP_API_URL=https://backend-api-production-5e68.up.railway.app
```

Then run:
```bash
npm run build
node build/index.js
```