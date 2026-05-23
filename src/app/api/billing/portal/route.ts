import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getUserPrimaryOrgId } from "@/lib/org";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl)
    return Response.json({ error: "NEXTAUTH_URL not set" }, { status: 500 });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeCustomerId: true },
  });
  if (!org?.stripeCustomerId)
    return Response.json({ error: "No billing customer" }, { status: 400 });

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/app/billing`,
  });

  return Response.json({ url: portal.url });
}
