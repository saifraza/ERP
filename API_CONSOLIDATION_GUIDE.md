# API Consolidation Guide

## Overview
We've consolidated from two APIs (backend-api and cloud-api) to just one (cloud-api) to simplify the architecture and reduce maintenance overhead.

## What Changed
1. **Removed backend-api** - All functionality is now in cloud-api
2. **Updated MCP Server** - Now points to cloud-api instead of backend-api
3. **Updated Documentation** - All references updated to cloud-api

## Steps to Complete Migration

### 1. Get Your Cloud API URL
Go to your Railway dashboard and find the cloud-api service URL. It will look like:
```
https://cloud-api-production-xxxx.up.railway.app
```

### 2. Update Railway Environment Variables

#### For Frontend Service:
```env
VITE_API_URL=https://cloud-api-production-xxxx.up.railway.app
```

#### For MCP Server:
```env
ERP_API_URL=https://cloud-api-production-xxxx.up.railway.app
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
ANTHROPIC_API_KEY=sk-ant-...
```

#### For Cloud API:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@postgres.railway.internal:5432/railway
JWT_SECRET=5WnoUWSdmFHvHdNI/BHh66Erc0feyawHFi88t/qBiSk=
PORT=3001
```

### 3. Run Database Migrations
Select the cloud-api service in Railway and run:
```bash
railway run npm run migrate
```

### 4. Seed Initial Data (Optional)
If you want demo data:
```bash
railway run npm run seed
```

### 5. Remove backend-api Service
Once everything is working:
1. Go to Railway dashboard
2. Find backend-api service
3. Click on it and select "Remove Service"

## Testing the Migration

### 1. Test Authentication
```bash
curl https://cloud-api-production-xxxx.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "saif", "password": "1234"}'
```

### 2. Test Health Check
```bash
curl https://cloud-api-production-xxxx.up.railway.app/health
```

### 3. Test Frontend
1. Open https://frontend-production-adfe.up.railway.app
2. Login with saif/1234
3. Complete company setup
4. Verify data saves correctly

### 4. Test MCP Server
The MCP server should still work with Gmail integration:
- Document analysis features
- Email attachment extraction
- AI-powered insights

## Benefits of Consolidation
1. **Simpler Architecture** - One API to maintain instead of two
2. **Reduced Costs** - One less service running on Railway
3. **Easier Debugging** - All API logic in one place
4. **Better Performance** - No inter-service communication overhead

## Troubleshooting

### If Frontend Can't Connect
1. Check VITE_API_URL is set correctly in Railway
2. Verify cloud-api is running (check logs)
3. Test the health endpoint directly

### If MCP Server Fails
1. Verify ERP_API_URL is updated
2. Check all Google OAuth credentials are set
3. Review MCP server logs in Railway

### If Database Issues
1. Ensure DATABASE_URL is correct
2. Run migrations: `railway run npm run migrate`
3. Check PostgreSQL service is running

## Next Steps
1. Monitor all services for 24 hours
2. Once stable, remove backend-api from Railway
3. Update any CI/CD pipelines to remove backend-api
4. Clean up any backend-api related code/configs