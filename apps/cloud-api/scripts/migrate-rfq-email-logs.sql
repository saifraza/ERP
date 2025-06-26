-- Create RFQEmailLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "RFQEmailLog" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL DEFAULT 'rfq_sent',
    "emailId" TEXT,
    "subject" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "ccEmails" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQEmailLog_pkey" PRIMARY KEY ("id")
);

-- Create RFQEmailResponse table if it doesn't exist
CREATE TABLE IF NOT EXISTS "RFQEmailResponse" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "attachments" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "extractedData" TEXT,
    "quotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQEmailResponse_pkey" PRIMARY KEY ("id")
);

-- Create RFQCommunicationThread table if it doesn't exist
CREATE TABLE IF NOT EXISTS "RFQCommunicationThread" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "threadId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQCommunicationThread_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on RFQCommunicationThread
CREATE UNIQUE INDEX IF NOT EXISTS "RFQCommunicationThread_rfqId_vendorId_key" ON "RFQCommunicationThread"("rfqId", "vendorId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "RFQEmailLog_rfqId_idx" ON "RFQEmailLog"("rfqId");
CREATE INDEX IF NOT EXISTS "RFQEmailLog_vendorId_idx" ON "RFQEmailLog"("vendorId");
CREATE INDEX IF NOT EXISTS "RFQEmailLog_sentAt_idx" ON "RFQEmailLog"("sentAt");
CREATE INDEX IF NOT EXISTS "RFQEmailLog_status_idx" ON "RFQEmailLog"("status");

CREATE INDEX IF NOT EXISTS "RFQEmailResponse_rfqId_idx" ON "RFQEmailResponse"("rfqId");
CREATE INDEX IF NOT EXISTS "RFQEmailResponse_vendorId_idx" ON "RFQEmailResponse"("vendorId");
CREATE INDEX IF NOT EXISTS "RFQEmailResponse_receivedAt_idx" ON "RFQEmailResponse"("receivedAt");
CREATE INDEX IF NOT EXISTS "RFQEmailResponse_processingStatus_idx" ON "RFQEmailResponse"("processingStatus");

-- Add foreign key constraints
ALTER TABLE "RFQEmailLog" 
    ADD CONSTRAINT "RFQEmailLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "RFQEmailLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RFQEmailResponse" 
    ADD CONSTRAINT "RFQEmailResponse_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "RFQEmailResponse_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RFQCommunicationThread" 
    ADD CONSTRAINT "RFQCommunicationThread_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "RFQCommunicationThread_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update triggers for updatedAt columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rfqemaillog_updated_at BEFORE UPDATE ON "RFQEmailLog"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqemailresponse_updated_at BEFORE UPDATE ON "RFQEmailResponse"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqcommunicationthread_updated_at BEFORE UPDATE ON "RFQCommunicationThread"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();