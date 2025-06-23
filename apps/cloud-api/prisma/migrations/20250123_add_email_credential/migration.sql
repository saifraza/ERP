-- CreateTable
CREATE TABLE "EmailCredential" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "emailAddress" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "googleRefreshToken" TEXT,
    "microsoftRefreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSynced" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailCredential_emailAddress_key" ON "EmailCredential"("emailAddress");

-- CreateIndex
CREATE INDEX "EmailCredential_companyId_idx" ON "EmailCredential"("companyId");

-- CreateIndex
CREATE INDEX "EmailCredential_userId_idx" ON "EmailCredential"("userId");

-- CreateIndex
CREATE INDEX "EmailCredential_provider_idx" ON "EmailCredential"("provider");

-- AddForeignKey
ALTER TABLE "EmailCredential" ADD CONSTRAINT "EmailCredential_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCredential" ADD CONSTRAINT "EmailCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;