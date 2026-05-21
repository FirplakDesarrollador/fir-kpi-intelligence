/**
 * File parser — client-side only.
 *
 * Parses .xlsx, .xls, and .csv files uploaded by the user using the `xlsx`
 * (SheetJS) package. Returns parsed rows keyed by DB column name.
 *
 * Column resolution is simple and explicit:
 *   • The uploaded file must use exact DB column names as its header row
 *     (matching the downloadable template).
 *   • Each header is checked against the table's column whitelist
 *     (getDbColumns from header-maps.ts).
 *   • Known columns are included in parsed rows.
 *   • Unknown columns are collected in unmappedHeaders (shown as warnings
 *     in the wizard) and are NEVER included in rows or sent to Supabase.
 *
 * No fuzzy matching, no label-to-key translation, no auto-conversion.
 */

import * as XLSX from "xlsx"
import type { TableSchema, FieldDef } from "./schema-definitions"
import { getDbColumns } from "./header-maps"

export type ParsedRow = Record<string, unknown>

export type ParseResult = {
  ok: boolean
  rows: ParsedRow[]
  /**
   * DB column → spreadsheet header for every column in the whitelist that
   * was found in the file. Since headers ARE DB column names the value will
   * always equal the key (e.g. { document_date: "document_date" }).
   * Kept as Record<string,string> for wizard compatibility.
   */
  columnMap: Record<string, string>
  /** Headers found in the file that are NOT in the table whitelist. */
  unmappedHeaders: string[]
  /** Parse-level error message (set when ok = false). */
  error?: string
  /** Total row count including empty rows before filtering. */
  rawRowCount: number
}

const MAX_ROWS = 50_000
const IS_DEV = process.env.NODE_ENV === "development"

export async function parseFile(
  file: File,
  schema: TableSchema
): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      dateNF: "yyyy-mm-dd",
    })

    // Use the sheet named "Datos" if present; otherwise the first sheet.
    const sheetName =
      workbook.SheetNames.find((n) => n === "Datos") ?? workbook.SheetNames[0]
    if (!sheetName) {
      return empty("El archivo no contiene hojas de cálculo.")
    }

    const ws = workbook.Sheets[sheetName]
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
      dateNF: "yyyy-mm-dd",
    })

    if (raw.length < 2) {
      return empty("El archivo no contiene filas de datos (mínimo: 1 encabezado + 1 fila).")
    }

    const [headerRow, ...dataRows] = raw
    const uploadedHeaders = (headerRow as unknown[]).map((h) =>
      String(h ?? "").trim()
    )

    // ── Column resolution — whitelist check only ──────────────────────────────
    const { columnMap, unmappedHeaders } = applyWhitelist(uploadedHeaders, schema.table)

    if (IS_DEV) {
      console.group(`[file-parser] ${schema.table} — column resolution`)
      console.log("uploaded headers:     ", uploadedHeaders)
      console.log("accepted (whitelist): ", Object.keys(columnMap))
      console.log("rejected (unknown):   ", unmappedHeaders)
      console.groupEnd()
    }

    // Reject if no required field was found
    const requiredFields = schema.fields.filter((f) => f.required)
    const mappedKeys = new Set(Object.keys(columnMap))
    const missingRequired = requiredFields.filter((f) => !mappedKeys.has(f.key))
    if (missingRequired.length > 0) {
      return empty(
        `Columnas requeridas no encontradas: ` +
          missingRequired.map((f) => `"${f.key}"`).join(", ") +
          `. Verifica que los encabezados coincidan con la plantilla.`
      )
    }

    // Index: header string → column index
    const headerIndexMap = Object.fromEntries(
      uploadedHeaders.map((h, i) => [h, i])
    ) as Record<string, number>

    // Index: DB column key → FieldDef (for type coercion)
    const fieldByKey = Object.fromEntries(
      schema.fields.map((f) => [f.key, f])
    ) as Record<string, FieldDef>

    // Build keyed rows
    const limitedRows = dataRows.slice(0, MAX_ROWS)
    const rows: ParsedRow[] = []

    for (const rawRow of limitedRows) {
      const arr = rawRow as unknown[]
      const row: ParsedRow = {}
      for (const [dbCol, header] of Object.entries(columnMap)) {
        const colIdx = headerIndexMap[header]
        const rawVal = colIdx !== undefined ? arr[colIdx] : undefined
        const field = fieldByKey[dbCol]
        row[dbCol] = field ? coerceValue(rawVal, field) : rawVal ?? null
      }
      // Skip completely empty rows
      const hasValue = Object.values(row).some(
        (v) => v !== null && v !== undefined && v !== ""
      )
      if (hasValue) rows.push(row)
    }

    return {
      ok: true,
      rows,
      columnMap,
      unmappedHeaders,
      rawRowCount: dataRows.length,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return empty(`Error al leer el archivo: ${msg}`)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function empty(error: string): ParseResult {
  return {
    ok: false,
    rows: [],
    columnMap: {},
    unmappedHeaders: [],
    error,
    rawRowCount: 0,
  }
}

/**
 * Checks each uploaded header against the table's column whitelist.
 *
 * Known columns (in whitelist) → added to columnMap as identity entries.
 * Unknown columns               → added to unmappedHeaders (dropped, warned).
 *
 * No fuzzy matching, no translation. Headers must be exact DB column names.
 */
function applyWhitelist(
  headers: string[],
  table: string
): {
  columnMap: Record<string, string>
  unmappedHeaders: string[]
} {
  const validCols = getDbColumns(table)
  const columnMap: Record<string, string> = {}
  const unmappedHeaders: string[] = []

  for (const header of headers) {
    if (!header) continue

    if (validCols.has(header)) {
      // Identity: the header IS the DB column name
      if (!columnMap[header]) columnMap[header] = header
    } else {
      unmappedHeaders.push(header)
    }
  }

  return { columnMap, unmappedHeaders }
}

function coerceValue(raw: unknown, field: FieldDef): unknown {
  if (raw === null || raw === undefined || raw === "") return null

  const s = String(raw).trim()
  if (s === "") return null

  switch (field.type) {
    case "number": {
      const n = parseFloat(s.replace(/,/g, ""))
      return Number.isNaN(n) ? null : n
    }
    case "boolean": {
      const lower = s.toLowerCase()
      if (lower === "true" || lower === "1" || lower === "sí" || lower === "si") return true
      if (lower === "false" || lower === "0" || lower === "no") return false
      return null
    }
    case "date": {
      if (raw instanceof Date) return raw.toISOString().slice(0, 10)
      const ddmm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
      if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      return s
    }
    case "string":
    default:
      return s
  }
}
