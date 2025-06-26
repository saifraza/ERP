#!/bin/bash

# Get auth token
echo "Logging in..."
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}' | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Got token successfully"

# Show current stats
echo -e "\nCurrent database stats:"
curl -s https://cloud-api-production-0f4d.up.railway.app/api/clear-database/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Ask for confirmation
echo -e "\nThis will DELETE ALL DATA from the Railway database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" == "yes" ]; then
  echo -e "\nClearing database..."
  curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/clear-database/clear-all \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
  echo -e "\n\nDatabase cleared!"
else
  echo "Cancelled"
fi