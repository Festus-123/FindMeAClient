import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic gate only: bounce visitors with no session cookie to /login for private pages.
 * Real authorization (signature, role, ownership) happens in each page and Server Action.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("fmc_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/inbox/:path*", "/admin/:path*", "/pay/:path*"],
};
