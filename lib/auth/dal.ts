/**
 * Auth Data Access Layer — server-only.
 *
 * verifySession()   — reads + verifies the session cookie; redirects to /login if absent.
 * getFirKpiUser()   — fetches the matching row from public.fir_kpi_users by auth user id.
 *
 * Relationship:  auth.users.id  =  fir_kpi_users.id
 */
import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { getSession } from "./session"
import { supabase } from "@/lib/supabase"
import type { FirKpiUser, SessionPayload } from "./types"

const isDev = process.env.NODE_ENV === "development"

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

/**
 * Returns the verified session payload or redirects to /login.
 * Memoised with React cache() so multiple Server Components in the same
 * render pass share one result without extra work.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
})

// ---------------------------------------------------------------------------
// getFirKpiUser
// ---------------------------------------------------------------------------

/**
 * Fetches the public.fir_kpi_users row whose id matches the Supabase Auth user id.
 *
 * Returns null when:
 *   • no row with that id exists
 *   • the Supabase query itself fails (RLS, network, etc.)
 */
export async function getFirKpiUser(
  authUserId: string
): Promise<FirKpiUser | null> {
  if (isDev) {
    console.log("[auth/dal] fir_kpi_users lookup →", { authUserId })
  }

  const { data, error } = await supabase
    .from("fir_kpi_users")
    .select("id, email, nombre, rol, activo, created_at")
    .eq("id", authUserId)
    .maybeSingle()

  if (isDev) {
    if (error) {
      console.error("[auth/dal] fir_kpi_users query error →", {
        authUserId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
    } else if (!data) {
      console.warn("[auth/dal] fir_kpi_users: no row found →", { authUserId })
    } else {
      console.log("[auth/dal] fir_kpi_users row found →", {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        rol: data.rol,
        activo: data.activo,
      })
    }
  }

  if (error || !data) return null
  return data as FirKpiUser
}
