-- Make Organization.slug optional so we can let paid orgs claim a subdomain later.
ALTER TABLE "Organization" ALTER COLUMN "slug" DROP NOT NULL;
