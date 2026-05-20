import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]
    .filter(Boolean)
    .join(", ")

  throw new Error(
    `Supabase client could not be initialized. ` +
      `The following environment variable(s) are missing or empty: ${missing}. ` +
      `Add them to your Vercel project settings under Settings → Environment Variables, ` +
      `then redeploy.`
  )
}

export const supabase = createClient(url, key)
