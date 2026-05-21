/**
 * Next.js 16 Proxy (replaces middleware.ts).
 *
 * Runs before every matched request to enforce authentication:
 * - Unauthenticated requests to protected routes → redirect to /login.
 * - Authenticated requests to /login → redirect to /dashboard.
 *
 * Only reads the session cookie and verifies the JWT signature.
 * No database calls here — that's intentional (keep the proxy fast).
 */

import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

import { SESSION_COOKIE } from "@/lib/auth/session"

// Routes that do NOT require authentication
const PUBLIC_PATHS = new Set(["/login"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.has(pathname)
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const authenticated = await isValidToken(token)

  // Authenticated user visiting /login → send to dashboard
  if (isPublic && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Unauthenticated user visiting a protected route → send to login
  if (!isPublic && !authenticated) {
    const loginUrl = new URL("/login", request.url)
    // Preserve the original destination so we can redirect back after login
    // (future enhancement — currently just goes to /dashboard)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    console.error(
      "[proxy] SESSION_SECRET is not set — all sessions will be rejected."
    )
    return false
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    })
    return true
  } catch {
    return false
  }
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|branding|.*\\.png$|.*\\.svg$).*)",
  ],
}
