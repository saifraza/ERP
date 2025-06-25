-- CreateTable for RFQ Email Log
CREATE TABLE "RFQEmailLog" (
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

-- CreateTable for RFQ Email Responses
CREATE TABLE "RFQEmailResponse" (
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

-- CreateTable for RFQ Communication Thread
CREATE TABLE "RFQCommunicationThread" (
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

-- Add email tracking fields to RFQVendor
ALTER TABLE "RFQVendor" ADD COLUMN IF NOT EXISTS "lastEmailSentAt" TIMESTAMP(3);
ALTER TABLE "RFQVendor" ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RFQVendor" ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3);
ALTER TABLE "RFQVendor" ADD COLUMN IF NOT EXISTS "quotationReceivedAt" TIMESTAMP(3);

-- Add communication preferences to Vendor
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "preferredCommunication" TEXT DEFAULT 'email';
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "emailResponseTime" INTEGER; -- Average response time in hours

-- CreateIndex
CREATE INDEX "RFQEmailLog_rfqId_idx" ON "RFQEmailLog"("rfqId");
CREATE INDEX "RFQEmailLog_vendorId_idx" ON "RFQEmailLog"("vendorId");
CREATE INDEX "RFQEmailLog_sentAt_idx" ON "RFQEmailLog"("sentAt");
CREATE INDEX "RFQEmailLog_status_idx" ON "RFQEmailLog"("status");

CREATE INDEX "RFQEmailResponse_rfqId_idx" ON "RFQEmailResponse"("rfqId");
CREATE INDEX "RFQEmailResponse_vendorId_idx" ON "RFQEmailResponse"("vendorId");
CREATE INDEX "RFQEmailResponse_receivedAt_idx" ON "RFQEmailResponse"("receivedAt");
CREATE INDEX "RFQEmailResponse_processingStatus_idx" ON "RFQEmailResponse"("processingStatus");

CREATE UNIQUE INDEX "RFQCommunicationThread_rfqId_vendorId_key" ON "RFQCommunicationThread"("rfqId", "vendorId");

-- AddForeignKey
ALTER TABLE "RFQEmailLog" ADD CONSTRAINT "RFQEmailLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RFQEmailLog" ADD CONSTRAINT "RFQEmailLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RFQEmailResponse" ADD CONSTRAINT "RFQEmailResponse_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RFQEmailResponse" ADD CONSTRAINT "RFQEmailResponse_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RFQCommunicationThread" ADD CONSTRAINT "RFQCommunicationThread_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RFQCommunicationThread" ADD CONSTRAINT "RFQCommunicationThread_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;