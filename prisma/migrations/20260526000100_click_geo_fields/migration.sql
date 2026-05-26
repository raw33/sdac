-- Add geo + device fields for analytics dashboards.
ALTER TABLE "ClickEvent"
ADD COLUMN     "country" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "os" TEXT;

