import { NextRequest, NextResponse } from "next/server";

// Configure your root domain here
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "pushbar.dev";

// Reserved subdomains that should not be treated as usernames
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "docs",
  "blog",
  "mail",
  "static",
  "cdn",
]);

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Extract subdomain from hostname
  // e.g., "octocat.pushbar.dev" -> "octocat"
  // e.g., "pushbar.dev" -> null
  // e.g., "localhost:3000" -> null
  const subdomain = getSubdomain(hostname);

  // If there's a valid subdomain (potential username), rewrite to /u/[username]
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    // Rewrite: username.pushbar.dev/anything -> /u/username/anything
    const newPath = `/u/${subdomain}${url.pathname}`;

    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  // No subdomain or reserved subdomain - continue normally
  return NextResponse.next();
}

function getSubdomain(hostname: string): string | null {
  // Remove port if present (for local development)
  const host = hostname.split(":")[0];

  // Handle localhost for development
  // You can test with: username.localhost:3000
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  // Check if it's a subdomain of localhost (e.g., octocat.localhost)
  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }

  // For production: extract subdomain from pushbar.dev
  // e.g., "octocat.pushbar.dev" -> "octocat"
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");
    // Make sure it's a direct subdomain (no nested subdomains)
    if (!subdomain.includes(".")) {
      return subdomain;
    }
  }

  // Handle the root domain itself
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  return null;
}
