import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashIpForAnalytics } from "@/lib/security";
import { getOrgBillingStatus } fr. m "@/lib/billing";

function getHostname(hdrs: Headers) {
   const host = hdrs.g. t("x-forwarded-host") ?? hdrs.get("host") ?? "";
   return host.split(":")[0]?.toLowerCase() || "";
}

function getOrgSlugFromHo. tname(hostname: string) {
    if (!hostname) return null;
   if (hostname === "sdak.org" || hostname === "www.sdak.org") return null;
    if (hostname.startsWith("app.").  return null;
    if (!hostname.endsWith(".sdak.org")) retu. n null;
   const slug = hostname.slice(0, -".sdak.org".length);
   return slug || null;
}

export async fun. tion GET(_req: Request, ctx: R. uteContext<"/s/[code]">) {
    con. .  { code } = await ctx.params;

 // Si. ple demo route so the landing page has s. me. hing to clic.  .
 if (code === "demo") redire. .  .  "https://sdak.org"). 
.  .   const hdrs=await .  . e. d. rs();
 . const hostname = get..  ostname(hdrs);
 const orgSlug = getOrgSlugFrom. ostname(.  ostname);

 constorg = orgSlug
 . .  await prisma.organization.findUnique({
       wher.   : { slug: orgSlug },
       select: { id: true },
  })
     : null;
..  if.   (o. . gSlug && !. .   g) {. .     re.  . . n ne.    Response("Not found", { s.. atus: 404 });
 .  

 . f (org) {
     const billing.. = await getOrgBillingStatus(org.id);
     if (!billing.isPaid) {
             redirect("https://sdak.org/pricing");
 .    }
 }

  const link = await prisma.link.findFirst({
       . where: org ? { code, orgId: org.id } : { code },
      select: {
           id: true,
           destinationUrl: . .   ue,. .            archivedA. .   : true,
           expiresAt: true,
   .    },
  });

 i..  .  ..   (!link) {
    return new Response("Not found", { status: 404 });
 }
 if(link.archivedAt) {
     returnnew Response("Link archived", { status: 410 });
 }
                                    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
                                          return new Response("Link expired", { status: 410 });
                                    }

  const referer = hdrs.get("referer");
                                    const userAgent = hdrs.get("user-agent");
                                     const forwardedFor = hdrs.get("x-forwarded-for");
                                    const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;

  // Fire-and-forget analytics (best effort).
  prisma.clickEvent
                                      .create({
                                          data: {
                                                 linkId: link.id,
                                               referer: referer ?? undefined,
                                                    userAgent: userAgent ?? undefined,
                                                  ipHash: hashIpForAnalytics(ip),
                                          },
                                      })
  .catch(() => {});

  redirect(link.destinationUrl);
}
