import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";

const schema = z.object({
  orgName: z.string().trim().min(2).max(120),
  orgSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const existingOrgId = await getUserPrimaryOrgId(userId);
  if (existingOrgId) return Response.json({ ok: true, orgId: existingOrgId });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: parsed.data.orgName, slug: parsed.data.orgSlug },
        select: { id: true },
      });

      await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId,
          role: "OWNER",
        },
        select: { id: true },
      });

      return org;
    });

    return Response.json({ ok: true, orgId: result.id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Could not create organization (slug may already exist)." },
      { status: 500 },
    );
  }
}
