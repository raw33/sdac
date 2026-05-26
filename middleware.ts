import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getHostname(req: NextRequest) {
  const host = req.headers.get("host") || "";
  return host.split(":")[0]?.toLowerCase() || "";
}

function isOrgSubdomain(hostname: string) {
  if (!hostname) return false;
  if (hostname === "sdak.org" || hostname === "www.sdak.org") return false;
  if (hostname.startsWith("app.")) return false;
  return hostname.endsWith(".sdak.org");
}

export function middleware(req: NextRequest) {
  const hostname = getHostname(req);
  const url = req.nextUrl;

  // When running the app on app.sdak.org, treat "/" as the dashboard entry.
  // Keep auth, API, and redirect routes intact.
  if (hostname.startsWith("app.")) {
    const pathname = url.pathname;
    if (pathname === "/") {
      const next = url.clone();
      next.pathname = "/app";
      return NextResponse.redirect(next);
    }
  }

  // Custom org subdomains like brown.sdak.org should support links at the root:
  // brown.sdak.org/my-event -> /s/my-event
  if (isOrgSubdomain(hostname)) {
    const pathname = url.pathname;

    if (
      pathname !== "/" &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next/") &&
      !pathname.startsWith("/s/")
    ) {
      const code = pathname.slice(1);
      // Only support single-segment slugs for short links.
      if (code && !code.includes("/")) {
        const next = url.clone();
        next.pathname = `/s/${code}`;
        return NextResponse.rewrite(next);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
