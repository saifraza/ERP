-- Add unique constraint to prevent duplicate email responses
-- First, delete any existing duplicates, keeping only the first one
DELETE FROM "RFQEmailResponse" r1
WHERE EXISTS (
  SELECT 1
  FROM "RFQEmailResponse" r2
  WHERE r1."emailId" = r2."emailId"
    AND r1."rfqId" = r2."rfqId"
    AND r1."vendorId" = r2."vendorId"
    AND r1."createdAt" > r2."createdAt"
);

-- Now add the unique constraint
CREATE UNIQUE INDEX "RFQEmailResponse_emailId_rfqId_vendorId_key" 
ON "RFQEmailResponse"("emailId", "rfqId", "vendorId");