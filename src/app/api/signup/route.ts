import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  orgName: z.string().trim().min(2).max(80),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

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

  let slugBase = slugify(orgName);
  if (!slugBase) slugBase = `org-${nanoid(6).toLowerCase()}`;

  let slug = slugBase;
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${slugBase}-${nanoid(4).toLowerCase()}`;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: null, passwordHash },
        select: { id: true },
      });
      const org = await tx.organization.create({
        data: { name: orgName, slug },
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

