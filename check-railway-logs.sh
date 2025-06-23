#!/bin/bash

echo "Fetching recent Railway logs for Gmail errors..."
echo "================================================"

cd /Users/saifraza/Library/Mobile\ Documents/com~apple~CloudDocs/Documents/Ethanol\ /Final\ documents\ /300/code/ERP

# First, make a request to trigger the error
echo "1. Triggering Gmail list request..."
TOKEN=$(curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saif@erp.com","password":"1234"}' | jq -r '.token')

curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/mcp/gmail/list-emails \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 1}' > /dev/null

echo "2. Waiting for logs to appear..."
sleep 3

echo "3. Fetching logs..."
railway logs --service cloud-api -n 20 | grep -A5 -B5 "Gmail\|403\|scope"