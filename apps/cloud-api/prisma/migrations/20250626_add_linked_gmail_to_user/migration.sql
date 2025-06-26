-- Add linkedGmailEmail to User table
ALTER TABLE "User" ADD COLUMN "linkedGmailEmail" TEXT;

-- Update existing users to use their email as linkedGmailEmail if it's a Gmail account
UPDATE "User" 
SET "linkedGmailEmail" = email 
WHERE email LIKE '%@%.%' AND "linkedGmailEmail" IS NULL;

-- Make linkedGmailEmail required for new users (after updating existing ones)
ALTER TABLE "User" ALTER COLUMN "linkedGmailEmail" SET NOT NULL;

-- Add unique constraint to ensure one Gmail per user
ALTER TABLE "User" ADD CONSTRAINT "User_linkedGmailEmail_key" UNIQUE ("linkedGmailEmail");

-- Add index for performance
CREATE INDEX "User_linkedGmailEmail_idx" ON "User"("linkedGmailEmail");