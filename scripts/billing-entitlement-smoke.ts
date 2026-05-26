import assert from "node:assert/strict";
import { computeOrgIsPaid } from "../src/lib/billing-entitlement.ts";

const now = new Date("2026-01-01T00:00:00.000Z");
const future = new Date("2026-02-01T00:00:00.000Z");
const past = new Date("2025-12-01T00:00:00.000Z");

assert.equal(
  computeOrgIsPaid({ subscriptionStatus: "active", stripeSubscriptionId: null, currentPeriodEnd: null, now }),
  true,
);
assert.equal(
  computeOrgIsPaid({ subscriptionStatus: "trialing", stripeSubscriptionId: null, currentPeriodEnd: null, now }),
  true,
);
assert.equal(
  computeOrgIsPaid({ subscriptionStatus: "past_due", stripeSubscriptionId: "sub_123", currentPeriodEnd: past, now }),
  true,
);
assert.equal(
  computeOrgIsPaid({ subscriptionStatus: null, stripeSubscriptionId: "sub_123", currentPeriodEnd: future, now }),
  true,
);
assert.equal(
  computeOrgIsPaid({ subscriptionStatus: "canceled", stripeSubscriptionId: "sub_123", currentPeriodEnd: future, now }),
  false,
);
assert.equal(
  computeOrgIsPaid({
    subscriptionStatus: "incomplete_expired",
    stripeSubscriptionId: "sub_123",
    currentPeriodEnd: future,
    now,
  }),
  false,
);

console.log("billing entitlement smoke: ok");
