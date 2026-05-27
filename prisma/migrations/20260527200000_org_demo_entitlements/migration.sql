ALTER TABLE "Organization"
  ADD COLUMN "demoMaxLinks" INTEGER,
  ADD COLUMN "demoAllowAnalytics" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demoAllowCustomSlugs" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demoAllowBrandedSubdomain" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demoAllowDestinationEdit" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demoExpiresAt" TIMESTAMP(3);

