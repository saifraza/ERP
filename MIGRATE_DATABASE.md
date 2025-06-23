# Database Migration Guide for Railway

## Steps to Create Database Tables

Since Railway doesn't automatically run migrations, you need to run them manually:

### Option 1: Using Railway CLI (Recommended)

1. Install Railway CLI:
```bash
curl -fsSL https://railway.app/install.sh | sh
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
railway link
```

4. Select the `cloud-api` service when prompted

5. Run migrations:
```bash
# This runs the migration in the Railway environment with the correct DATABASE_URL
railway run npm run migrate
```

### Option 2: Using Railway Web Console

1. Go to your Railway project dashboard
2. Click on the `cloud-api` service
3. Go to the "Settings" tab
4. Under "Deploy", find "Run Command"
5. Enter: `npm run migrate`
6. Click "Run"

### Option 3: Direct Database Connection

1. Get your database connection string from Railway:
   - Go to the PostgreSQL service in Railway
   - Click "Connect" tab
   - Copy the DATABASE_URL

2. Run migrations locally:
```bash
cd apps/cloud-api
DATABASE_URL="your-railway-database-url" npx prisma migrate deploy
```

## Verify Tables Were Created

After running migrations, verify the tables:

1. In Railway, go to your PostgreSQL service
2. Click on the "Data" tab
3. You should see these tables:
   - User
   - Company
   - CompanyUser
   - Factory
   - Document
   - DocumentActivity
   - PlantMetrics
   - AlertLog
   - DashboardConfig

## Troubleshooting

### If migrations fail:

1. Check the DATABASE_URL is correct:
```bash
railway run echo $DATABASE_URL
```

2. Check if you can connect to the database:
```bash
railway run npx prisma db pull
```

3. Reset and try again:
```bash
# BE CAREFUL: This will delete all data!
railway run npx prisma migrate reset
```

### Common Issues:

1. **"P1001: Can't reach database server"**
   - Make sure you're using the internal URL: `postgres.railway.internal`
   - The public URL won't work from within Railway

2. **"P3009: migrate found failed migrations"**
   - Previous migration failed
   - Run: `railway run npx prisma migrate resolve --applied "20240101000000_init"`

3. **"Permission denied"**
   - Make sure your database user has CREATE TABLE permissions
   - This should be automatic on Railway

## Next Steps

Once tables are created:

1. The backend API will start using the database instead of mock data
2. Company data will persist in PostgreSQL
3. You can view and manage data through Railway's data browser

## Testing Database Connection

After migration, test that everything works:

1. Go to https://frontend-production-adfe.up.railway.app
2. Create a new company through setup
3. Check Railway PostgreSQL data browser - you should see the company in the database
4. The company should persist even after refreshing the page