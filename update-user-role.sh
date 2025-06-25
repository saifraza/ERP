#!/bin/bash

echo "Updating user role to ADMIN..."

# Call the setup endpoint
curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/setup-divisions/setup-user-admin \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\nDone! You should now be able to update company details."