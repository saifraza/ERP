-- Create VendorEmail table to support multiple emails per vendor
CREATE TABLE "VendorEmail" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'primary', -- primary, secondary, personal, accounts, sales, etc.
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "contactName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorEmail_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "VendorEmail_vendorId_idx" ON "VendorEmail"("vendorId");
CREATE INDEX "VendorEmail_email_idx" ON "VendorEmail"("email");
CREATE UNIQUE INDEX "VendorEmail_email_key" ON "VendorEmail"("email", "vendorId");

-- Add foreign key
ALTER TABLE "VendorEmail" 
    ADD CONSTRAINT "VendorEmail_vendorId_fkey" 
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update trigger for updatedAt
CREATE TRIGGER update_vendoremail_updated_at BEFORE UPDATE ON "VendorEmail"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing vendor emails to the new table
INSERT INTO "VendorEmail" ("vendorId", "email", "type", "isPrimary", "isActive")
SELECT "id", "email", 'primary', true, true
FROM "Vendor"
WHERE "email" IS NOT NULL AND "email" != '';

-- Add a comment to the table
COMMENT ON TABLE "VendorEmail" IS 'Stores multiple email addresses per vendor for flexible communication';
COMMENT ON COLUMN "VendorEmail"."type" IS 'Email type: primary, secondary, personal, accounts, sales, etc.';
COMMENT ON COLUMN "VendorEmail"."isPrimary" IS 'Primary email used for official communication like RFQs';