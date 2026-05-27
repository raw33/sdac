import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  orgName: z.string().trim().min(2).max(80),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const orgName = parsed.data.orgName;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: null, passwordHash },
        select: { id: true },
      });
      const org = await tx.organization.create({
        data: { name: orgName, slug: null },
        select: { id: true },
      });
      await tx.orgMember.create({
        data: { userId: user.id, orgId: org.id, role: "OWNER" },
        select: { id: true },
      });
    });
  } catch {
    return Response.json({ error: "Could not create account" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
