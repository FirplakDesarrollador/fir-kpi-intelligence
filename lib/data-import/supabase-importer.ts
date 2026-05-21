/**
 * Supabase importer — client-side only.
 *
 * Inserts validated rows into the target Supabase table in batches, using the
 * public anon client.
 *
 * Insert strategy per table:
 *  • sales_fact       — plain INSERT (no conflict target).  document_number +
 *                       item_code is NOT a unique key; the same pair can appear
 *                       multiple times with different dimensions.
 *  • orders_fact      — UPSERT on document_number, item_code.
 *  • deliveries_fact  — UPSERT on delivery_number, item_code.
 *
 * Sanitisation: every row is filtered through getDbColumns(table), which
 * returns only the keys that are explicitly mapped to a DB column in
 * header-maps.ts. Any key that is mapped to null (e.g. "canal", "currency"
 * for sales_fact) is stripped before the payload reaches Supabase.
 *
 * Only the public anon key is used — never the service_role key.
 */

import { supabase } from "@/lib/supabase"
import { getDbColumns, SALES_FACT_COLUMNS, ORDERS_FACT_COLUMNS, DELIVERIES_FACT_COLUMNS } from "./header-maps"
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
const IS_DEV = process.env.NODE_ENV === "development"

/**
 * Import rows into Supabase in batches.
 *
 * @param rows        Validated clean rows from the validator.
 * @param schema      Table schema — provides the table name.
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

  // ── Whitelist: DB columns that physically exist in this table ─────────────
  // Sourced exclusively from header-maps.ts — never from schema.fields keys —
  // so null-mapped headers (e.g. "Canal" / "Moneda" for sales_fact) cannot
  // accidentally slip into the payload even if they appear in parsed rows.
  const validDbCols = getDbColumns(schema.table)

  if (IS_DEV) {
    const whitelistByTable: Record<string, ReadonlySet<string>> = {
      sales_fact:      SALES_FACT_COLUMNS,
      orders_fact:     ORDERS_FACT_COLUMNS,
      deliveries_fact: DELIVERIES_FACT_COLUMNS,
    }
    const firstRow = rows[0] ?? {}
    const incomingKeys = Object.keys(firstRow)
    const payloadKeys = incomingKeys.filter((k) => validDbCols.has(k))
    const droppedKeys = incomingKeys.filter((k) => !validDbCols.has(k))
    console.group(`[supabase-importer] ${schema.table} — pre-insert audit`)
    console.log("whitelist:                   ", [...(whitelistByTable[schema.table] ?? validDbCols)])
    console.log("incoming row keys:            ", incomingKeys)
    console.log("final insert payload keys:    ", payloadKeys)
    console.log("dropped (not in whitelist):   ", droppedKeys)
    if (droppedKeys.length > 0) {
      console.warn(
        `[supabase-importer] ${schema.table}: ${droppedKeys.length} field(s) dropped before insert:`,
        droppedKeys
      )
    }
    console.groupEnd()
  }

  const batchErrors: string[] = []
  let insertedCount = 0

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE)

    // Sanitize each row:
    //  1. Keep only keys present in the DB-column whitelist.
    //  2. Strip null / empty values so Supabase uses column defaults.
    const cleaned = batch.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(
          ([k, v]) =>
            validDbCols.has(k) &&
            v !== null &&
            v !== undefined &&
            v !== ""
        )
      )
    )

    // sales_fact has no single composite unique key — use plain insert so that
    // valid rows with repeated document_number + item_code are never dropped.
    // Other tables upsert on their declared conflict key for idempotency.
    const { error, count } =
      schema.table === "sales_fact"
        ? await supabase.from(schema.table).insert(cleaned, { count: "exact" })
        : await supabase
            .from(schema.table)
            .upsert(cleaned, { onConflict: upsertKey(schema.table), count: "exact" })

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

/**
 * Conflict / upsert key per table. sales_fact is intentionally absent —
 * it uses plain insert (see call site above).
 */
function upsertKey(table: string): string {
  const keys: Record<string, string> = {
    orders_fact:     "document_number,item_code",
    deliveries_fact: "delivery_number,item_code",
  }
  return keys[table] ?? "id"
}
