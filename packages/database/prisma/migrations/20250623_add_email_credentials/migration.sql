-- CreateTable
CREATE TABLE "email_credentials" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "email_address" TEXT NOT NULL,
    "google_refresh_token" TEXT,
    "microsoft_refresh_token" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_credentials_email_address_key" ON "email_credentials"("email_address");

-- CreateIndex
CREATE INDEX "email_credentials_company_id_idx" ON "email_credentials"("company_id");

-- CreateIndex
CREATE INDEX "email_credentials_user_id_idx" ON "email_credentials"("user_id");

-- AddForeignKey
ALTER TABLE "email_credentials" ADD CONSTRAINT "email_credentials_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_credentials" ADD CONSTRAINT "email_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;