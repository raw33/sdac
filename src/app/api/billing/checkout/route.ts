import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getUserPrimaryOrgId } from "@/lib/org";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  const email = session?.user?.email ?? null;
  if (!userId || !email)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId)
    return Response.json({ error: "Billing not configured" }, { status: 500 });

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl)
    return Response.json({ error: "NEXTAUTH_URL not set" }, { status: 500 });

  const stripe = getStripe();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeCustomerId: true, name: true },
  });
  if (!org) return Response.json({ error: "Org not found" }, { status: 404 });

  const customerId =
    org.stripeCustomerId ??
    (
      await stripe.customers.create({
        email,
        name: org.name,
        metadata: { orgId },
      })
    ).id;

  if (!org.stripeCustomerId) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { stripeCustomerId: customerId },
      select: { id: true },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/billing?success=1`,
    cancel_url: `${baseUrl}/app/billing?canceled=1`,
    allow_promotion_codes: true,
    client_reference_id: orgId,
    metadata: { orgId },
    subscription_data: {
      metadata: { orgId },
    },
  });

  return Response.json({ url: checkout.url }, { status: 201 });
}
