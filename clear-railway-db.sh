#!/bin/bash

# Clear Railway database
echo "Clearing Railway database..."

# First check stats
echo "Current database stats:"
curl -X GET https://cloud-api-production-0f4d.up.railway.app/api/clear-database/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo -e "\n\nClearing all data..."
curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/clear-database/clear-all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

echo -e "\n\nDatabase cleared. New stats:"
curl -X GET https://cloud-api-production-0f4d.up.railway.app/api/clear-database/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo -e "\n\nDone! Please logout and login again to go through setup."