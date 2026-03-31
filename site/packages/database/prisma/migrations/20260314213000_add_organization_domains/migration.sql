-- CreateTable
CREATE TABLE IF NOT EXISTS "organization_domains" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_dns',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" TEXT,
    "verification_token" TEXT,
    "verification_record_name" TEXT,
    "verification_record_type" TEXT,
    "cname_target" TEXT,
    "provider_ref" TEXT,
    "provider_status" TEXT,
    "provider_data" JSONB,
    "ssl_status" TEXT,
    "last_checked_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "organization_domains_hostname_key" ON "organization_domains"("hostname");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "organization_domains_organization_id_idx" ON "organization_domains"("organization_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "organization_domains_organization_id_status_idx" ON "organization_domains"("organization_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "organization_domains_organization_id_is_primary_idx" ON "organization_domains"("organization_id", "is_primary");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organization_domains_organization_id_fkey'
    ) THEN
        ALTER TABLE "organization_domains"
            ADD CONSTRAINT "organization_domains_organization_id_fkey"
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
