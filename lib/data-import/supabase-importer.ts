/**
 * Supabase importer — client-side only.
 *
 * Inserts validated rows into the target Supabase table in batches, using the
 * public anon client. The import is treated as an UPSERT so re-running the
 * same file is idempotent (Supabase upserts on the primary key).
 *
 * Only the public anon key is used — never the service_role key.
 */

import { supabase } from "@/lib/supabase"
import type { ParsedRow } from "./file-parser"
import type { TableSchema } from "./schema-definitions"

export type ImportProgress = {
  processed: number
  total: number
  batchErrors: string[]
}

export type ImportResult = {
  ok: boolean
  insertedCount: number
  batchErrors: string[]
  error?: string
}

const BATCH_SIZE = 500

/**
 * Import rows into Supabase in batches.
 *
 * @param rows    Validated clean rows from the validator.
 * @param schema  Table schema (provides the table name).
 * @param onProgress  Optional callback fired after each batch.
 */
export async function importRows(
  rows: ParsedRow[],
  schema: TableSchema,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  if (rows.length === 0) {
    return { ok: true, insertedCount: 0, batchErrors: [] }
  }

  const batchErrors: string[] = []
  let insertedCount = 0

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE)

    // Strip null values so Supabase uses column defaults
    const cleaned = batch.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== "")
      )
    )

    const { error, count } = await supabase
      .from(schema.table)
      .upsert(cleaned, { onConflict: primaryKey(schema.table), count: "exact" })

    if (error) {
      batchErrors.push(
        `Lote ${Math.floor(offset / BATCH_SIZE) + 1}: ${error.message}`
      )
    } else {
      insertedCount += count ?? batch.length
    }

    onProgress?.({
      processed: Math.min(offset + BATCH_SIZE, rows.length),
      total: rows.length,
      batchErrors,
    })
  }

  return {
    ok: batchErrors.length === 0,
    insertedCount,
    batchErrors,
    error: batchErrors.length > 0 ? batchErrors.join("; ") : undefined,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Primary / conflict key per table. Must match the Supabase table definition. */
function primaryKey(table: string): string {
  const keys: Record<string, string> = {
    sales_fact: "document_number,item_code",
    orders_fact: "document_number,item_code",
    deliveries_fact: "delivery_number,item_code",
  }
  return keys[table] ?? "id"
}
