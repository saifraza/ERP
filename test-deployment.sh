#!/bin/bash

echo "Testing ERP Deployment"
echo "====================="
echo ""

# Test API Health
echo "1. Testing API Health..."
curl -s https://cloud-api-production-0f4d.up.railway.app/health | python3 -m json.tool
echo ""

# Test Login with username
echo "2. Testing Login with username 'saif'..."
response=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}')
echo "$response" | python3 -m json.tool
echo ""

# Extract token if login successful
if echo "$response" | grep -q "token"; then
  token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
  if [ ! -z "$token" ]; then
    echo "3. Login successful! Token received."
    echo ""
    echo "4. Testing authenticated endpoint..."
    curl -s https://cloud-api-production-0f4d.up.railway.app/api/auth/verify \
      -H "Authorization: Bearer $token" | python3 -m json.tool
  fi
else
  echo "Login failed. You may need to run database migrations first."
  echo ""
  echo "To run migrations:"
  echo "1. cd '/Users/saifraza/Library/Mobile Documents/com~apple~CloudDocs/Documents/Ethanol /Final documents /300/code/ERP'"
  echo "2. railway link (select MSPIL_ERP)"
  echo "3. railway run --service cloud-api npm run migrate"
  echo "4. railway run --service cloud-api npm run seed"
fi