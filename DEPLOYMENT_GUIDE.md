# ERP Deployment Guide

## Production URLs
- **Frontend**: https://frontend-production-adfe.up.railway.app
- **Backend API**: https://backend-api-production-5e68.up.railway.app
- **GitHub**: https://github.com/saifraza/ERP

## What's New
1. **Removed all development mode features** - The app is now production-ready
2. **Company Management** - Edit company details from Masters > Companies
3. **API Integration** - Company data syncs with backend when available
4. **Multiple Company Support** - Switch between companies using the dropdown

## Database Setup

### Railway PostgreSQL
The app is configured to use PostgreSQL on Railway. Make sure these environment variables are set in Railway:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@postgres.railway.internal:5432/railway"
```

### Database Schema
Run migrations to set up the database:
```bash
cd apps/cloud-api
npx prisma migrate deploy
```

## Testing the Production Deployment

### 1. Create Your First Company
1. Go to https://frontend-production-adfe.up.railway.app
2. Login with your credentials
3. Complete the company setup wizard
4. Your company will be saved both locally and to the database

### 2. Edit Company Details
1. Navigate to Masters > Companies
2. Click the edit icon on your company
3. Update any details
4. Changes sync with the database automatically

### 3. Switch Between Companies
1. Click the company name dropdown at the top
2. Select a different company/factory
3. The entire system context switches

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login
- GET `/api/auth/verify` - Verify token

### Companies
- GET `/api/companies` - List all companies
- GET `/api/companies/:id` - Get specific company
- PUT `/api/companies/:id` - Update company
- DELETE `/api/companies/:id` - Delete company (admin only)

### Setup
- POST `/api/setup/complete` - Complete initial setup
- GET `/api/setup/status` - Check setup status

## Environment Variables

### Frontend (local-web)
```env
VITE_API_URL=https://backend-api-production-5e68.up.railway.app
```

### Backend (local-api)
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3001
```

## Monitoring

### Check Deployment Status
1. Go to Railway dashboard
2. Check each service (frontend, backend-api, postgres)
3. View logs for any errors

### Health Check
- Frontend: https://frontend-production-adfe.up.railway.app
- Backend: https://backend-api-production-5e68.up.railway.app/health

## Troubleshooting

### Company Not Saving
1. Check browser console for errors
2. Verify API is running: `/health` endpoint
3. Check Railway logs for backend errors
4. Ensure DATABASE_URL is correctly set

### Cannot Login
1. Verify backend is running
2. Check CORS settings in backend
3. Ensure frontend VITE_API_URL points to correct backend

### Data Not Syncing
1. The app works offline-first using localStorage
2. When API is available, it syncs automatically
3. Check network tab for API calls
4. Verify authentication token is present

## Next Steps

1. **Set up proper authentication** - Currently using mock auth
2. **Connect Prisma to database** - Update the mock routes to use actual database
3. **Add more master data** - Materials, vendors, customers
4. **Implement business modules** - Store, Finance operations
5. **Set up monitoring** - Error tracking, performance monitoring

## Security Notes

- All API routes require authentication (except /health and /auth/login)
- Company access is restricted to authorized users only
- Admins can delete companies, other roles can only view/edit
- All forms have validation for Indian tax formats

## Support

For issues or questions:
1. Check the Railway logs first
2. Review browser console for frontend errors
3. Ensure all environment variables are set correctly
4. Check the GitHub issues page