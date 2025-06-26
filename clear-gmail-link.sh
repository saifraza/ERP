#!/bin/bash

echo "Alternative method to clear Gmail link..."

# Use the email-oauth unlink endpoint instead
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Got auth token"

# Try using the unlink endpoint
echo "Attempting to unlink Gmail..."
curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/email-oauth/unlink \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\nDone!"