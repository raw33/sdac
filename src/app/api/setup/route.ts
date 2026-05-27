import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  orgName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = setupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { ok: false, error: "Setup already completed." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: parsed.data.orgName, slug: null },
    });

    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name?.trim() || null,
        passwordHash,
      },
    });

    await tx.orgMember.create({
      data: { orgId: org.id, userId: user.id, role: "OWNER" },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
