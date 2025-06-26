#!/bin/bash

echo "Clearing linked email from Railway database..."

# Get auth token
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Got auth token"

# Clear linked email
RESPONSE=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/clear-linked-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $RESPONSE"
echo "Done!"