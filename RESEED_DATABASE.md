# How to Reseed Your Railway Database

Your ERP system is asking for company setup because the database is empty. Here's how to fix it:

## Option 1: Quick Fix via Railway CLI (Recommended)

1. Open your terminal and navigate to the project:
```bash
cd /Users/saifraza/Library/Mobile\ Documents/com~apple~CloudDocs/Documents/Ethanol\ /Final\ documents\ /300/code/ERP
```

2. Connect to your Railway project:
```bash
railway link
```

3. Run migrations and seed from the cloud-api directory:
```bash
cd apps/cloud-api
railway run --service cloud-api npm run migrate
railway run --service cloud-api npm run seed
```

## Option 2: Manual Seed via Railway Dashboard

1. Go to your Railway dashboard
2. Open the **cloud-api** service
3. Click on the "Railway" tab
4. Click "Run a command"
5. Run these commands one by one:
   ```
   npm run migrate
   npm run seed
   ```

## Option 3: Use the Setup Wizard

Since the database is empty, you can use the setup wizard:

1. Go to https://frontend-production-adfe.up.railway.app
2. Complete the company setup form with:
   - **Company Name**: Your Factory Name
   - **Email**: admin@erp.com
   - **Password**: admin123
   - Fill other required fields

## What the Seed Script Creates

The seed script creates:
- Default admin user (admin@erp.com / admin123)
- Manager user (manager@erp.com / manager123)
- Operator user (operator@erp.com / operator123)
- Default company settings
- Sample data for testing

## Verify Database Connection

To check if your database is properly connected:

1. Go to Railway dashboard
2. Check the **cloud-api** service logs
3. Look for "Database connected successfully" message

## Common Issues

### "Invalid DATABASE_URL"
- Check that your cloud-api service has the DATABASE_URL environment variable
- It should point to your PostgreSQL database

### "Connection refused"
- Your database might be sleeping (Railway free tier)
- Visit your app to wake it up

### Data disappears after some time
- This might happen on free tier if the database sleeps
- Consider upgrading to Railway's paid tier for persistent data

## Next Steps

After seeding:
1. Login with admin@erp.com / admin123
2. Complete any remaining company setup
3. Start using your ERP system!