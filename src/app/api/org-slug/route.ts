import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgBillingStatus } from "@/lib/billing";
import { getUserOrgRole, getUserPrimaryOrgId } from "@/lib/org";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slugRaw = url.searchParams.get("slug") ?? "";
  const parsed = slugSchema.safeParse(slugRaw);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid slug" },
      { status: 400 },
    );
  }

  const slug = parsed.data;
  const existing = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  return Response.json({ ok: true, slug, available: !existing });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const role = await getUserOrgRole(userId, orgId);
  if (role !== "OWNER" && role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const billing = await getOrgBillingStatus(orgId);
  if (!billing.isPaid) {
    return Response.json(
      { error: "Upgrade required to claim a subdomain.", code: "UPGRADE_REQUIRED" },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const slugRaw = (body as { slug?: unknown } | null)?.slug;
  const parsed = slugSchema.safeParse(slugRaw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const slug = parsed.data;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });
  if (!org) return Response.json({ error: "No org" }, { status: 400 });
  if (org.slug) return Response.json({ ok: true, slug: org.slug });

  try {
    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { slug },
      select: { slug: true },
    });
    return Response.json({ ok: true, slug: updated.slug }, { status: 200 });
  } catch {
    return Response.json(
      { error: "That slug is already taken.", code: "SLUG_TAKEN" },
      { status: 409 },
    );
  }
}

