import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/features/auth/lib/token";

/**
 * ROUTE PROTECTION
 *
 * Runs before any admin route renders, so an unauthenticated request never
 * reaches a page, a data fetch or the repository layer — it is turned around at
 * the edge.
 *
 * This is the first of two locks. The second is `requireSession()` in the admin
 * layout: middleware is the cheap, early check, and the layout guard is the one
 * that still holds if the matcher below is ever mis-edited.
 */

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifyToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  // Already signed in and heading for the login page → straight to the panel.
  if (pathname === "/login") {
    if (!session) return NextResponse.next();

    const from = request.nextUrl.searchParams.get("from");
    const target = from?.startsWith("/admin") ? from : "/admin";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (session) return NextResponse.next();

  /* Unauthorised → the login page, remembering where they were going so they
     land on the page they asked for rather than a generic dashboard. */
  const login = new URL("/login", request.url);
  login.searchParams.set("from", `${pathname}${search}`);

  const response = NextResponse.redirect(login);
  // An expired or tampered cookie is cleared on the way out, so the browser
  // stops sending a token that will never verify again.
  response.cookies.delete(SESSION_COOKIE);

  return response;
}

export const config = {
  /**
   * The admin surface and the login page itself.
   *
   * Everything else — the marketing site, the sitemap, static assets — is
   * public and must not pay for this check.
   */
  matcher: ["/admin/:path*", "/admin", "/login"],
};
