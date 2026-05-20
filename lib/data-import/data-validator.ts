/**
 * Data validator — client-side only.
 *
 * Runs three validation passes over the parsed rows:
 *  1. Required field check — every required column must be non-empty.
 *  2. Type check — values must be coercible to the declared type.
 *  3. Duplicate check — within the batch, document/delivery key must be unique
 *     (configurable per table).
 *
 * Returns a ValidationResult with per-row errors so the wizard can display
 * an annotated preview table before the user confirms the import.
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
  /** Rows that failed at least one check (will not be imported). */
  errorRows: ParsedRow[]
  errors: RowError[]
  /** Summary counts. */
  totalRows: number
  cleanCount: number
  errorCount: number
}

/** Natural-key fields per table used for duplicate detection within the batch. */
const DUPLICATE_KEYS: Record<string, string[]> = {
  sales_fact: ["document_number", "item_code"],
  orders_fact: ["document_number", "item_code"],
  deliveries_fact: ["delivery_number", "item_code"],
}

export function validateRows(
  rows: ParsedRow[],
  schema: TableSchema
): ValidationResult {
  const errors: RowError[] = []
  const errorRowIndices = new Set<number>()
  const seenKeys = new Set<string>()
  const dupeFields = DUPLICATE_KEYS[schema.table] ?? []

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

    // 3. Duplicate key within batch
    if (dupeFields.length > 0) {
      const compositeKey = dupeFields
        .map((k) => String(row[k] ?? ""))
        .join("|")
      if (compositeKey && compositeKey !== "|".repeat(dupeFields.length - 1)) {
        if (seenKeys.has(compositeKey)) {
          const keyLabel = dupeFields.join(" + ")
          errors.push({
            row: rowNum,
            field: dupeFields[0],
            message: `Clave duplicada en el lote (${keyLabel}): "${compositeKey}".`,
          })
          errorRowIndices.add(i)
        } else {
          seenKeys.add(compositeKey)
        }
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
    totalRows: rows.length,
    cleanCount: cleanRows.length,
    errorCount: errorRows.length,
  }
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
