import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Shared Supabase client — lazy singleton.
 *
 * The client is NOT created at module-evaluation time. It is initialised on
 * the first property access (i.e. the first actual DB call). This prevents
 * Next.js from throwing during the build-time page-data collection phase when
 * the NEXT_PUBLIC_* env vars have not yet been injected into the build
 * environment.
 *
 * The env vars are still required at runtime. If they are missing when the
 * first query is made, a clear error is thrown pointing to Vercel settings.
 */

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const missing = (
      [
        !url && "NEXT_PUBLIC_SUPABASE_URL",
        !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ] as (string | false)[]
    )
      .filter(Boolean)
      .join(", ")

    throw new Error(
      `Supabase client could not be initialized. ` +
        `The following environment variable(s) are missing or empty: ${missing}. ` +
        `Add them to your Vercel project settings under Settings → Environment Variables, ` +
        `then redeploy.`
    )
  }

  return createClient(url, key)
}

// Lazy singleton — resolved on first use, not at module evaluation time.
let _instance: SupabaseClient | null = null

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_instance) _instance = buildClient()
    return Reflect.get(_instance, prop, receiver)
  },
})
