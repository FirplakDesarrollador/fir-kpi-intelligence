"use server"

/**
 * Auth Server Actions — login and logout.
 *
 * Login flow:
 *   1. signInWithPassword  — verify credentials with Supabase Auth
 *   2. fir_kpi_users query — fetch profile by auth.users.id
 *   3. activo check        — deny if false
 *   4. createSession       — write signed JWT cookie
 *   5. redirect            — /dashboard
 */

import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

import { createSession, deleteSession } from "./session"
import type { FirKpiUser } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Debug snapshot returned to the client (development only). */
export type AuthDebugInfo = {
  authUserId: string
  authEmail: string
  table: "fir_kpi_users"
  rowFound: boolean
  row: Omit<FirKpiUser, "created_at"> | null
  activo: boolean | null
  queryError: string | null
}

export type LoginState =
  | { error: string; debug?: AuthDebugInfo }
  | undefined

const isDev = process.env.NODE_ENV === "development"

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email    = (formData.get("email")    as string ?? "").trim().toLowerCase()
  const password =  formData.get("password") as string ?? ""

  if (!email || !password) {
    return { error: "Por favor ingresa tu correo y contraseña." }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return { error: "Error de configuración del servidor. Contacta al administrador." }
  }

  // Fresh, non-persisted client — no shared auth state across concurrent requests.
  const authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── Step 1: Supabase Auth ────────────────────────────────────────────────
  if (isDev) console.log("[auth/actions] signInWithPassword →", { email })

  const { data: authData, error: authError } =
    await authClient.auth.signInWithPassword({ email, password })

  if (authError || !authData.user) {
    if (isDev) {
      console.warn("[auth/actions] Supabase Auth failed →", {
        email,
        code: authError?.code,
        message: authError?.message,
      })
    }
    return { error: "Correo o contraseña incorrectos." }
  }

  const authUserId    = authData.user.id
  const authUserEmail = authData.user.email ?? email

  if (isDev) {
    console.log("[auth/actions] Supabase Auth OK →", { authUserId, email: authUserEmail })
  }

  // ── Step 2: fir_kpi_users profile query ─────────────────────────────────
  // IMPORTANT: use authClient (not the shared anon client) so the request
  // carries the authenticated session. RLS policy `auth.uid() = id` requires
  // an auth context — the anon client has none and returns 0 rows silently.
  const { data: profileData, error: profileError } = await authClient
    .from("fir_kpi_users")
    .select("id, email, nombre, rol, activo")
    .eq("id", authUserId)
    .maybeSingle()

  if (isDev) {
    console.log("[auth/actions] fir_kpi_users raw result →", {
      data: profileData,
      error: profileError,
    })
  }

  // Build debug snapshot — only populated in development.
  const debug: AuthDebugInfo | undefined = isDev
    ? {
        authUserId,
        authEmail:  authUserEmail,
        table:      "fir_kpi_users",
        rowFound:   !!profileData,
        row:        profileData as Omit<FirKpiUser, "created_at"> | null,
        activo:     profileData ? (profileData as FirKpiUser).activo : null,
        queryError: profileError?.message ?? null,
      }
    : undefined

  if (profileError || !profileData) {
    return {
      error: "Tu cuenta no tiene acceso a esta plataforma. Contacta al administrador.",
      debug,
    }
  }

  const profile = profileData as FirKpiUser

  // ── Step 3: Active check ─────────────────────────────────────────────────
  if (!profile.activo) {
    if (isDev) {
      console.warn("[auth/actions] Access denied — activo is false →", {
        authUserId,
        email: authUserEmail,
      })
    }
    return { error: "Tu cuenta está inactiva. Contacta al administrador.", debug }
  }

  // ── Step 4: Session cookie ───────────────────────────────────────────────
  await createSession({
    userId: authUserId,
    email:  profile.email,
    nombre: profile.nombre,
    rol:    profile.rol,
  })

  if (isDev) {
    console.log("[auth/actions] Session created → /dashboard", {
      authUserId,
      nombre: profile.nombre,
      rol:    profile.rol,
    })
  }

  redirect("/dashboard")
}

// ---------------------------------------------------------------------------
// logoutAction
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  await deleteSession()
  redirect("/login")
}
