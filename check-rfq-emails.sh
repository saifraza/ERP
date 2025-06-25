#!/bin/bash

RFQ_ID="f0d5185c-2b71-493f-8f3a-808885fa79c4"

echo "Checking RFQ email status..."

# Check RFQ status
curl -s "https://cloud-api-production-0f4d.up.railway.app/api/rfqs/${RFQ_ID}" \
  -H "Authorization: Bearer $(cat ~/.erp-token 2>/dev/null || echo 'YOUR_TOKEN')" \
  | jq '.rfq | {rfqNumber, status, vendors: .vendors[] | {vendorName: .vendor.name, email: .vendor.email, emailSent, emailSentAt}}'

echo -e "\n\nTo see sent emails in the UI:"
echo "1. Go to: https://frontend-production-adfe.up.railway.app/procurement/rfqs/${RFQ_ID}"
echo "2. Or check Email & AI Hub: https://frontend-production-adfe.up.railway.app/mails"
echo "3. Look for emails with subject containing your RFQ number"