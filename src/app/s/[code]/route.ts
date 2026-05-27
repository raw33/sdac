import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashIpForAnalytics } from "@/lib/security";
import { getOrgEntitlements } from "@/lib/entitlements";
function getHostname(hdrs: Headers) {
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  return host.split(":")[0]?.toLowerCase() || "";
}

function firstHeader(hdrs: Headers, keys: string[]) {
  for (const key of keys) {
    const value = hdrs.get(key);
    if (value) return value;
  }
  return null;
}

function parseFloatOrNull(value: string | null) {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function parseDeviceType(userAgent: string | null) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "mobile";
  return "desktop";
}

function parseBrowser(userAgent: string | null) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/") || ua.includes("edge/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("chromium") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  return "Other";
}

function parseOs(userAgent: string | null) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows nt")) return "Windows";
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "Other";
}

function getOrgSlugFromHostname(hostname: string) {
  if (!hostname) return null;
  if (hostname === "sdak.org" || hostname === "www.sdak.org") return null;
  if (hostname.startsWith("app.")) return null;
  if (!hostname.endsWith(".sdak.org")) return null;
  const slug = hostname.slice(0, -".sdak.org".length);
  return slug || null;
}

export async function GET(_req: Request, ctx: RouteContext<"/s/[code]">) {
  const { code } = await ctx.params;

  // Simple demo route so the landing page has something to click.
  if (code === "demo") redirect("https://sdak.org");

  const hdrs = await headers();
  const hostname = getHostname(hdrs);
  const orgSlug = getOrgSlugFromHostname(hostname);

  const org = orgSlug
    ? await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true },
      })
    : null;

  if (orgSlug && !org) {
    return new Response("Not found", { status: 404 });
  }

  if (org) {
    const entitlements = await getOrgEntitlements(org.id);
    if (!entitlements.canUseBrandedSubdomain) {
      redirect("https://sdak.org/pricing");
    }
  }

  const link = await prisma.link.findFirst({
    where: org ? { code, orgId: org.id } : { code },
    select: {
      id: true,
      destinationUrl: true,
      archivedAt: true,
      expiresAt: true,
    },
  });

  if (!link) {
    return new Response("Not found", { status: 404 });
  }
  if (link.archivedAt) {
    return new Response("Link archived", { status: 410 });
  }
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return new Response("Link expired", { status: 410 });
  }

  const referer = hdrs.get("referer");
  const userAgent = hdrs.get("user-agent");
  const forwardedFor = hdrs.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;

  // Prefer platform-provided geo headers (Vercel/Cloudflare). Do not store raw IP.
  const country = firstHeader(hdrs, ["x-vercel-ip-country", "cf-ipcountry"]);
  const region = firstHeader(hdrs, ["x-vercel-ip-country-region"]);
  const city = firstHeader(hdrs, ["x-vercel-ip-city"]);
  const latitude = parseFloatOrNull(firstHeader(hdrs, ["x-vercel-ip-latitude"]));
  const longitude = parseFloatOrNull(firstHeader(hdrs, ["x-vercel-ip-longitude"]));

  const deviceType = parseDeviceType(userAgent);
  const browser = parseBrowser(userAgent);
  const os = parseOs(userAgent);

  // Fire-and-forget analytics (best effort).
  prisma.clickEvent
    .create({
      data: {
        linkId: link.id,
        referer: referer ?? undefined,
        userAgent: userAgent ?? undefined,
        ipHash: hashIpForAnalytics(ip),
        country: country ?? undefined,
        region: region ?? undefined,
        city: city ?? undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        deviceType: deviceType ?? undefined,
        browser: browser ?? undefined,
        os: os ?? undefined,
      },
    })
    .catch(() => {});

  redirect(link.destinationUrl);
}
