/**
 * Data validator — client-side only.
 *
 * Runs three validation passes over the parsed rows:
 *  1. Required field check — every required column must be non-empty.
 *  2. Type check — values must be coercible to the declared type.
 *  3. Duplicate check — behaviour differs per table:
 *
 *     • orders_fact / deliveries_fact — BLOCKING: rows with a repeated
 *       (document_number|item_code) or (delivery_number|item_code) key are
 *       rejected because that pair truly identifies a unique business line.
 *
 *     • sales_fact — SOFT WARNING only: the same document_number + item_code
 *       can legitimately repeat across sellers, stores, cost centres, projects,
 *       etc.  Only 100 % identical rows (every field equal) trigger a warning;
 *       those rows are still imported.
 *
 * Returns a ValidationResult with per-row errors AND warnings so the wizard
 * can display an annotated preview before the user confirms the import.
 */

import type { TableSchema, FieldDef } from "./schema-definitions"
import type { ParsedRow } from "./file-parser"

export type RowError = {
  /** 1-based row number (row 2 = first data row after the header). */
  row: number
  /** Field key that triggered the error. */
  field: string
  /** Human-readable Spanish message. */
  message: string
}

export type ValidationResult = {
  valid: boolean
  /** Rows that passed all checks (will be imported). */
  cleanRows: ParsedRow[]
  /** Rows that failed at least one blocking check (will NOT be imported). */
  errorRows: ParsedRow[]
  errors: RowError[]
  /** Soft warnings — rows are still imported but flagged for review. */
  warnings: RowError[]
  /** Summary counts. */
  totalRows: number
  cleanCount: number
  errorCount: number
  warningCount: number
}

// ---------------------------------------------------------------------------
// Duplicate detection configuration
// ---------------------------------------------------------------------------

/**
 * BLOCKING duplicate keys — a repeated composite key causes the row to be
 * rejected entirely.  Only for tables where the key truly identifies a unique
 * business line.
 */
const BLOCKING_DUPLICATE_KEYS: Record<string, string[]> = {
  orders_fact:     ["document_number", "item_code"],
  deliveries_fact: ["delivery_number", "item_code"],
}

/**
 * Tables that use SOFT duplicate detection instead of blocking.
 * For these, only exact full-row matches (every field identical) produce a
 * warning; the rows are still included in cleanRows and will be imported.
 *
 * sales_fact is here because document_number + item_code is not unique —
 * the same combo can appear multiple times with different seller/store/
 * cost_centre/project/segment/price/discount/etc. dimensions.
 */
const SOFT_DUPLICATE_TABLES = new Set<string>(["sales_fact"])

// ---------------------------------------------------------------------------
// validateRows
// ---------------------------------------------------------------------------

export function validateRows(
  rows: ParsedRow[],
  schema: TableSchema
): ValidationResult {
  const errors: RowError[] = []
  const warnings: RowError[] = []
  const errorRowIndices = new Set<number>()

  // Blocking dedup state
  const blockingFields = BLOCKING_DUPLICATE_KEYS[schema.table] ?? []
  const seenBlockingKeys = new Set<string>()

  // Soft dedup state (exact full-row fingerprint)
  const isSoftTable = SOFT_DUPLICATE_TABLES.has(schema.table)
  const seenFingerprints = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2: 1-based + header row offset

    // 1. Required field check
    for (const field of schema.fields.filter((f) => f.required)) {
      const val = row[field.key]
      if (isEmpty(val)) {
        errors.push({
          row: rowNum,
          field: field.key,
          message: `"${field.label}" es obligatorio y está vacío.`,
        })
        errorRowIndices.add(i)
      }
    }

    // 2. Type check — only for fields that have a non-null value
    for (const field of schema.fields) {
      const val = row[field.key]
      if (isEmpty(val)) continue
      const typeError = checkType(val, field, rowNum)
      if (typeError) {
        errors.push(typeError)
        errorRowIndices.add(i)
      }
    }

    // 3a. Blocking duplicate check (orders_fact, deliveries_fact)
    if (blockingFields.length > 0) {
      const compositeKey = blockingFields
        .map((k) => String(row[k] ?? ""))
        .join("|")
      const isBlank = compositeKey === "|".repeat(blockingFields.length - 1)
      if (compositeKey && !isBlank) {
        if (seenBlockingKeys.has(compositeKey)) {
          errors.push({
            row: rowNum,
            field: blockingFields[0],
            message: `Clave duplicada en el lote (${blockingFields.join(" + ")}): "${compositeKey}".`,
          })
          errorRowIndices.add(i)
        } else {
          seenBlockingKeys.add(compositeKey)
        }
      }
    }

    // 3b. Soft duplicate check (sales_fact) — full-row fingerprint, warning only
    if (isSoftTable) {
      const fingerprint = rowFingerprint(row, schema)
      if (seenFingerprints.has(fingerprint)) {
        warnings.push({
          row: rowNum,
          field: "document_number",
          message: `Fila exactamente duplicada en el lote (todos los campos son idénticos). Se importará igualmente.`,
        })
        // NOT added to errorRowIndices — row still imported
      } else {
        seenFingerprints.add(fingerprint)
      }
    }
  }

  const cleanRows = rows.filter((_, i) => !errorRowIndices.has(i))
  const errorRows = rows.filter((_, i) => errorRowIndices.has(i))

  return {
    valid: errors.length === 0,
    cleanRows,
    errorRows,
    errors,
    warnings,
    totalRows: rows.length,
    cleanCount: cleanRows.length,
    errorCount: errorRows.length,
    warningCount: warnings.length,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Produces a deterministic string fingerprint of all field values in a row.
 * Used for exact full-row duplicate detection in soft-dedup tables.
 */
function rowFingerprint(row: ParsedRow, schema: TableSchema): string {
  return schema.fields
    .map((f) => `${f.key}=${String(row[f.key] ?? "")}`)
    .join("\x00")
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val: unknown): boolean {
  return val === null || val === undefined || val === ""
}

function checkType(
  val: unknown,
  field: FieldDef,
  row: number
): RowError | null {
  switch (field.type) {
    case "number":
      if (typeof val !== "number" && Number.isNaN(Number(val))) {
        return {
          row,
          field: field.key,
          message: `"${field.label}" debe ser un número. Valor recibido: "${val}".`,
        }
      }
      break
    case "boolean":
      if (typeof val !== "boolean") {
        return {
          row,
          field: field.key,
          message: `"${field.label}" debe ser verdadero/falso. Valor recibido: "${val}".`,
        }
      }
      break
    case "date":
      if (typeof val === "string" && !/^\d{4}-\d{2}-\d{2}/.test(val)) {
        return {
          row,
          field: field.key,
          message: `"${field.label}" debe ser una fecha (YYYY-MM-DD). Valor recibido: "${val}".`,
        }
      }
      break
    default:
      break
  }
  return null
}
