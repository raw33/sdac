import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function toDate(seconds: number | null | undefined) {
  if (!seconds) return null;
  return new Date(seconds * 1000);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return Response.json({ error: "Webhook not configured" }, { status: 500 });

  const stripe = getStripe();
  const payload = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature)
    return Response.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        mode?: string;
        subscription?: string | null;
        customer?: string | null;
        metadata?: Record<string, string> | null;
      };

      const orgId = session.metadata?.orgId;
      if (session.mode === "subscription" && session.subscription && orgId) {
        const subRes = await stripe.subscriptions.retrieve(session.subscription);
        const sub = (subRes as unknown as { data?: unknown }).data ?? subRes;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: (sub as { id: string }).id,
            subscriptionStatus: (sub as { status: string }).status,
            currentPeriodEnd: toDate(
              (sub as { current_period_end?: number | null }).current_period_end,
            ),
            cancelAtPeriodEnd: Boolean(
              (sub as { cancel_at_period_end?: boolean | null }).cancel_at_period_end,
            ),
          },
          select: { id: true },
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as {
        id: string;
        status: string;
        current_period_end?: number | null;
        cancel_at_period_end?: boolean | null;
        metadata?: Record<string, string> | null;
      };

      await prisma.organization.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          subscriptionStatus: sub.status,
          currentPeriodEnd: toDate(sub.current_period_end ?? null),
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        },
      });
    }
  } catch {
    // Return 200 to avoid retries storm; the UI will remain "not paid" until next successful webhook.
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true });
}
