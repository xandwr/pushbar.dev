import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

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

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/explore',
  '/docs',
  '/u/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/assets/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Handle subdomain routing
  const subdomain = getSubdomain(hostname);
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const newPath = `/u/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0];

  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");
    if (!subdomain.includes(".")) {
      return subdomain;
    }
  }

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  return null;
}
