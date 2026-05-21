/**
 * Session management — server-only.
 *
 * Uses a signed HS256 JWT stored in an HttpOnly cookie.
 * The JWT contains only the SessionPayload (no passwords, no Supabase tokens).
 *
 * Required env var: SESSION_SECRET
 *   Generate with: openssl rand -base64 32
 *   Add to .env.local (local) and Vercel Environment Variables (production).
 */
import "server-only"

import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

import type { SessionPayload } from "./types"

export const SESSION_COOKIE = "firplak_session"
/** 8-hour session — short enough for enterprise, long enough for a workday. */
const SESSION_HOURS = 8

function getEncodedSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. " +
        "Generate one with `openssl rand -base64 32` and add it to .env.local " +
        "(local dev) and Vercel Environment Variables (production)."
    )
  }
  return new TextEncoder().encode(secret)
}

/** Signs a JWT containing the given session payload. */
export async function encryptSession(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getEncodedSecret())
}

/**
 * Verifies and decodes a JWT.
 * Returns `null` if the token is missing, expired, or tampered with.
 */
export async function decryptSession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(
      token,
      getEncodedSecret(),
      { algorithms: ["HS256"] }
    )
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Writes the session cookie. Call after successful login. */
export async function createSession(data: SessionPayload): Promise<void> {
  const token = await encryptSession(data)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/",
  })
}

/** Removes the session cookie. Call on logout. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/** Reads and verifies the session cookie. Returns `null` if absent or invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return decryptSession(token)
}
