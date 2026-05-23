import { prisma } from "@/lib/prisma";

export async function getUserPrimaryOrgId(userId: string) {
  const membership = await prisma.orgMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { orgId: true },
  });
  return membership?.orgId ?? null;
}

export async function getUserOrgRole(userId: string, orgId: string) {
  const membership = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}
