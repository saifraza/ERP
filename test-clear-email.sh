#!/bin/bash

echo "Testing email clear endpoint..."

# Get auth token with full response
echo "1. Getting auth token..."
LOGIN_RESPONSE=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."

# Test auth verify
echo -e "\n2. Testing auth verify..."
curl -X GET https://cloud-api-production-0f4d.up.railway.app/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# Clear linked email with verbose output
echo -e "\n\n3. Clearing linked email..."
curl -v -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/clear-linked-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"