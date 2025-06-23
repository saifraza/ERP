# Fix Database Connection for Railway

## The Issue
Your cloud-api service doesn't have the DATABASE_URL environment variable set, which is why migrations and seeding are failing.

## Solution 1: Add Database URL to cloud-api Service

1. **Go to Railway Dashboard**
2. **Click on your cloud-api service**
3. **Go to Variables tab**
4. **Add these variables**:

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_DB_HOST]:5432/railway
JWT_SECRET=your-secret-key-here
```

To find your database URL:
1. Go to your PostgreSQL service in Railway
2. Click on Variables tab
3. Copy the DATABASE_URL value

## Solution 2: Connect Database to cloud-api

If you have a PostgreSQL database in the same project:

1. **In Railway Dashboard**
2. **Click on cloud-api service**
3. **Go to Variables tab**
4. **Click "Add Variable Reference"**
5. **Select your PostgreSQL service**
6. **Choose DATABASE_URL**

## Solution 3: Quick Setup Using Web Interface

Since your database is empty, the easiest solution is:

1. **Go to**: https://frontend-production-adfe.up.railway.app
2. **Complete the setup form**:
   - Company Name: Your Factory Name
   - Email: admin@erp.com
   - Password: admin123
   - Fill other details as needed
3. **Click "Complete Setup"**

## After Fixing Database Connection

Once DATABASE_URL is set, run these commands:

```bash
cd apps/cloud-api
railway run npm run migrate
railway run npm run seed
```

Or run them directly in Railway:
1. Go to cloud-api service
2. Click Settings → Railway
3. Click "Run a command"
4. Run: `npm run migrate`
5. Then run: `npm run seed`

## Verify Connection

To verify your database is connected:

```bash
cd apps/cloud-api
railway run npx prisma db push
```

This should show "Database is already in sync" if everything is working.

## Common Database URLs

Railway PostgreSQL typically looks like:
```
postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

External connection (for local testing):
```
postgresql://postgres:PASSWORD@viaduct.proxy.rlwy.net:PORT/railway
```

## Still Having Issues?

1. Check Railway logs for cloud-api service
2. Ensure PostgreSQL service is running
3. Verify the password in DATABASE_URL is correct
4. Try using the external database URL first