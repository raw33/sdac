-- Make passwordHash optional to support OAuth users.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Stripe billing fields (org-scoped).
ALTER TABLE "Organization"
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

