import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperuserEmail } from "@/lib/superuser";

const schema = z.object({
  orgId: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isSuperuserEmail(email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, name: null, passwordHash: null },
    update: {},
    select: { id: true, email: true },
  });

  const membership = await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: parsed.data.orgId } },
    create: { userId: user.id, orgId: parsed.data.orgId, role: parsed.data.role },
    update: { role: parsed.data.role },
    select: { id: true, role: true },
  });

  return Response.json({ ok: true, user, membership });
}

