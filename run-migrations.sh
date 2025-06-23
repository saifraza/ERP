#!/bin/bash

echo "🚀 ERP Database Migration Runner"
echo "================================"
echo ""
echo "Waiting for deployment to complete..."
sleep 60

echo "Checking database status..."
curl -s https://cloud-api-production-0f4d.up.railway.app/api/db-status | python3 -m json.tool

echo ""
echo "Running migrations and seeding database..."
echo "This may take a few minutes..."

response=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/run-migrations)

if echo "$response" | grep -q "success"; then
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "Testing login..."
    curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email": "saif", "password": "1234"}' | python3 -m json.tool
    echo ""
    echo "🎉 Setup complete! You can now login at:"
    echo "   https://frontend-production-adfe.up.railway.app"
    echo "   Username: saif"
    echo "   Password: 1234"
else
    echo "❌ Migration failed:"
    echo "$response" | python3 -m json.tool
    echo ""
    echo "Check Railway logs for more details."
fi