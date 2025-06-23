#!/bin/bash

echo "ERP Database Setup"
echo "=================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in ERP root directory"
    echo "Please run: cd '/Users/saifraza/Library/Mobile Documents/com~apple~CloudDocs/Documents/Ethanol /Final documents /300/code/ERP'"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
railway run --service cloud-api "cd apps/cloud-api && npm run migrate"

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
    echo ""
    
    # Run seed
    echo "🌱 Seeding database with default data..."
    railway run --service cloud-api "cd apps/cloud-api && npm run seed"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully!"
        echo ""
        echo "🎉 Setup complete! You can now login with:"
        echo "   Username: saif"
        echo "   Password: 1234"
        echo ""
        echo "🌐 Frontend URL: https://frontend-production-adfe.up.railway.app"
    else
        echo "❌ Seeding failed. Check Railway logs for details."
    fi
else
    echo "❌ Migrations failed. Check Railway logs for details."
    echo ""
    echo "Common issues:"
    echo "1. Make sure you've run: railway link"
    echo "2. Check if DATABASE_URL is set in Railway"
    echo "3. Ensure PostgreSQL service is running"
fi