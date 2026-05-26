export function computeOrgIsPaid(input: {
  subscriptionStatus: string | null | undefined;
  stripeSubscriptionId: string | null | undefined;
  currentPeriodEnd: Date | null | undefined;
  now?: Date;
}) {
  const rawStatus = input.subscriptionStatus ?? null;
  const subscriptionStatus =
    typeof rawStatus === "string" && rawStatus.trim().length > 0
      ? rawStatus.trim().toLowerCase()
      : null;

  const hasSubscription = Boolean(input.stripeSubscriptionId);
  const nowMs = (input.now ?? new Date()).getTime();
  const end = input.currentPeriodEnd ?? null;
  const isWithinPeriod = end instanceof Date ? end.getTime() > nowMs : false;

  return (
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due" ||
    (hasSubscription &&
      isWithinPeriod &&
      subscriptionStatus !== "canceled" &&
      subscriptionStatus !== "incomplete_expired")
  );
}

