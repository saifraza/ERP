import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function repairMigrations() {
  try {
    console.log('Checking migration status...')
    
    // Mark the failed migration as resolved
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations" 
      SET "finished_at" = NOW(), 
          "applied_steps_count" = 1 
      WHERE "migration_name" = '20250123_add_email_credential' 
      AND "finished_at" IS NULL
    `
    
    console.log('Migration marked as resolved')
    
    // Check if EmailCredential table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'EmailCredential'
      );
    ` as any[]
    
    if (!tableExists[0].exists) {
      console.log('EmailCredential table does not exist, creating it...')
      
      // Create the table manually
      await prisma.$executeRaw`
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
      `
      
      // Create indexes
      await prisma.$executeRaw`CREATE UNIQUE INDEX "EmailCredential_emailAddress_key" ON "EmailCredential"("emailAddress");`
      await prisma.$executeRaw`CREATE INDEX "EmailCredential_companyId_idx" ON "EmailCredential"("companyId");`
      await prisma.$executeRaw`CREATE INDEX "EmailCredential_userId_idx" ON "EmailCredential"("userId");`
      await prisma.$executeRaw`CREATE INDEX "EmailCredential_provider_idx" ON "EmailCredential"("provider");`
      
      // Add foreign keys
      await prisma.$executeRaw`ALTER TABLE "EmailCredential" ADD CONSTRAINT "EmailCredential_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
      await prisma.$executeRaw`ALTER TABLE "EmailCredential" ADD CONSTRAINT "EmailCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
      
      console.log('EmailCredential table created successfully')
    } else {
      console.log('EmailCredential table already exists')
    }
    
    console.log('Migration repair completed')
  } catch (error) {
    console.error('Error repairing migrations:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

repairMigrations()