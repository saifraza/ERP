#!/bin/bash

echo "Clearing company data from Railway database..."

# Login and clear in one command
curl -s -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}' | \
  grep -o '"token":"[^"]*' | sed 's/"token":"//' | \
  xargs -I {} curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/simple-clear/company \
    -H "Authorization: Bearer {}" \
    -H "Content-Type: application/json"

echo -e "\n\nDone!"