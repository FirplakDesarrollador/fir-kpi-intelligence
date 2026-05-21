/**
 * public.fir_kpi_users row — exact schema.
 *
 * id          uuid  PK, references auth.users(id)
 * email       text
 * nombre      text
 * rol         text
 * activo      boolean
 * created_at  timestamptz
 */
export type FirKpiUser = {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  created_at: string | null
}

/**
 * Payload embedded in the signed session JWT.
 * Contains only what the UI needs — no passwords or auth tokens.
 */
export type SessionPayload = {
  /** auth.users.id — also the fir_kpi_users.id */
  userId: string
  email: string
  nombre: string
  rol: string
}
