-- AlterTable
ALTER TABLE "Requisition" ADD COLUMN "divisionId" TEXT;

-- Update existing requisitions to have a divisionId (this will be NULL initially)
-- You'll need to manually update these or create a data migration

-- Make divisionId required after updating existing data
-- ALTER TABLE "Requisition" ALTER COLUMN "divisionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Requisition_divisionId_idx" ON "Requisition"("divisionId");

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;