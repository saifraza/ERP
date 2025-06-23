# Complete Database Setup Guide

## Overview
This guide will help you set up the complete database system for the ERP with all tables and relationships.

## What's Been Done

### 1. Complete Database Schema Created
- **Core Tables**: User, Company, Factory, CompanyUser
- **Master Data**: Vendor, Customer, Material, Account, TaxRate, HSNCode, UOM
- **Store Module**: Requisition, PurchaseOrder, GoodsReceipt, Inventory, StockTransfer
- **Finance Module**: Invoice, Payment, Receipt, Banking, JournalEntry
- **Production**: SugarProduction, PowerGeneration, EthanolProduction, FeedProduction
- **Farmer Management**: Farmer, CaneDelivery, FarmerPayment
- **Common**: WeighbridgeEntry, Equipment, Maintenance

### 2. Backend API Updated
- Real authentication with JWT
- Company management with database
- Setup wizard saves to database
- Proper middleware and error handling

## Step-by-Step Setup

### 1. Update Frontend Environment
Create `.env` file in `apps/local-web`:
```env
VITE_API_URL=https://cloud-api-production-0f4d.up.railway.app
```

### 2. Deploy to Railway

The code will auto-deploy, but you need to run migrations:

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Link to your project and select cloud-api service
railway link

# Run migrations
railway run npm run migrate

# Seed initial data (creates users and demo company)
railway run npm run seed
```

#### Option B: Using Railway Web Console
1. Go to Railway dashboard
2. Click on `cloud-api` service
3. Go to "Settings" → "Deploy"
4. Run these commands one by one:
   - `npm run migrate` (creates tables)
   - `npm run seed` (creates initial data)

### 3. Verify Database Setup

Check if tables were created:
```bash
railway run npx prisma studio
```

Or check via API:
https://cloud-api-production-0f4d.up.railway.app/api/setup/db-status

### 4. Default Login Credentials

After running seed:
- **Admin**: admin@erp.com / admin123
- **Manager**: manager@erp.com / manager123
- **Operator**: operator@erp.com / operator123

### 5. Test the System

1. Go to https://frontend-production-adfe.up.railway.app
2. Login with admin credentials
3. If seed was run, you'll see "Demo Sugar Mills Pvt Ltd"
4. If not, complete the setup wizard
5. Check Railway database - data should be there!

## API Endpoints Now Working

### Authentication
- POST `/api/auth/login` - Login with email/password
- POST `/api/auth/register` - Register new user
- GET `/api/auth/verify` - Verify JWT token

### Companies
- GET `/api/companies` - List user's companies
- GET `/api/companies/:id` - Get specific company
- PUT `/api/companies/:id` - Update company (Admin only)
- DELETE `/api/companies/:id` - Delete company (Owner only)

### Setup
- POST `/api/setup/complete` - Complete initial setup
- GET `/api/setup/status` - Check if setup is done
- GET `/api/setup/db-status` - Check database connection

## Troubleshooting

### "Cannot find module" errors
The cloud-api uses TypeScript. Make sure Railway runs:
```
npm run build
npm start
```

### "P1001: Can't reach database"
Check DATABASE_URL in Railway environment variables. Should be:
```
postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

### "Table does not exist"
Run migrations:
```bash
railway run npm run migrate
```

### Reset Everything
BE CAREFUL - This deletes all data:
```bash
railway run npx prisma migrate reset
railway run npm run seed
```

## Next Steps

1. **Test Production**:
   - Create a company through setup
   - Edit company details
   - Check database has the data

2. **Implement More Modules**:
   - Store module (requisitions, POs)
   - Finance module (invoices, payments)
   - Production tracking

3. **Add Reports**:
   - Dashboard analytics
   - Financial statements
   - Production reports

## Database Schema Documentation

See `DATABASE_SCHEMA.md` for complete details on:
- All tables and relationships
- Field descriptions
- Business logic
- Indian compliance features

## Environment Variables

Make sure these are set in Railway:

### cloud-api service:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### frontend service:
```env
VITE_API_URL=https://cloud-api-production-0f4d.up.railway.app
```

## Success Checklist

- [ ] Migrations run successfully
- [ ] Seed data created
- [ ] Can login with admin@erp.com
- [ ] Can create new company
- [ ] Company data persists in database
- [ ] Can edit company details
- [ ] Multiple users can access same company

Once all checked, your database is fully operational!