#!/bin/bash

# Test Gmail OAuth Integration

echo "Testing Gmail OAuth Integration..."
echo "================================="

# First, get authentication token
echo -e "\n1. Getting auth token..."
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saif@erp.com","password":"1234"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"

# Test health endpoint
echo -e "\n2. Testing health endpoint..."
HEALTH=$(curl -s https://cloud-api-production-0f4d.up.railway.app/api/mcp/health \
  -H "Authorization: Bearer $TOKEN")

echo "Health Response:"
echo "$HEALTH" | jq .

# Test OAuth endpoint
echo -e "\n3. Testing OAuth endpoint..."
OAUTH_TEST=$(curl -s https://cloud-api-production-0f4d.up.railway.app/api/mcp/oauth-test \
  -H "Authorization: Bearer $TOKEN")

echo "OAuth Test Response:"
echo "$OAUTH_TEST" | jq .

# Try to list emails
echo -e "\n4. Attempting to list emails..."
EMAILS=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/list-emails \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 2}')

echo "List Emails Response:"
echo "$EMAILS" | jq .

echo -e "\n================================="
echo "Test complete!"