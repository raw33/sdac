import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";

const patchSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i)
    .optional()
    .or(z.literal("")),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  destinationUrl: z.string().trim().url().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ linkId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const { linkId } = await ctx.params;

  const existing = await prisma.link.findFirst({
    where: { id: linkId, orgId, archivedAt: null },
    select: { id: true, code: true, destinationUrl: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const billing = await getOrgBillingStatus(orgId);

  const requestedCode = parsed.data.code?.trim() || null;
  const title = parsed.data.title?.trim() || null;
  const destinationUrl = parsed.data.destinationUrl;

  if (requestedCode && requestedCode !== existing.code && !billing.isPaid) {
    return Response.json(
      { error: "Upgrade required to change the short slug.", code: "UPGRADE_REQUIRED" },
      { status: 402 },
    );
  }

  if (typeof destinationUrl === "string" && destinationUrl !== existing.destinationUrl && !billing.isPaid) {
    return Response.json(
      { error: "Upgrade required to change destinations." },
      { status: 402 },
    );
  }

  try {
    await prisma.link.update({
      where: { id: existing.id },
      data: {
        code: requestedCode && requestedCode !== existing.code ? requestedCode : undefined,
        title: title ?? undefined,
        destinationUrl: destinationUrl ?? undefined,
      },
    });
  } catch {
    if (requestedCode && requestedCode !== existing.code) {
      return Response.json(
        { error: "That short slug is already taken.", code: "CODE_TAKEN" },
        { status: 409 },
      );
    }
    throw new Error("Link update failed");
  }

  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ linkId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const { linkId } = await ctx.params;

  const existing = await prisma.link.findFirst({
    where: { id: linkId, orgId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.link.update({
    where: { id: existing.id },
    data: { archivedAt: new Date() },
  });

  return Response.json({ ok: true });
}
