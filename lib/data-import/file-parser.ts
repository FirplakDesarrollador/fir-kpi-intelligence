/**
 * File parser — client-side only.
 *
 * Parses .xlsx, .xls, and .csv files uploaded by the user using the `xlsx`
 * (SheetJS) package. Returns a parsed result with raw rows and header
 * detection for the active table schema.
 *
 * Supports two file layouts:
 *  - "label" mode: the header row matches the Spanish label from the schema
 *    (as downloaded from the template generator).
 *  - "key" mode: the header row uses snake_case column keys directly.
 */

import * as XLSX from "xlsx"
import type { TableSchema, FieldDef } from "./schema-definitions"

export type ParsedRow = Record<string, unknown>

export type ParseResult = {
  ok: boolean
  rows: ParsedRow[]
  /** Detected column mapping: schema field key → spreadsheet column header. */
  columnMap: Record<string, string>
  /** Headers found in the file that could NOT be mapped to any schema field. */
  unmappedHeaders: string[]
  /** Parse-level error message (set when ok = false). */
  error?: string
  /** Total row count including empty rows before filtering. */
  rawRowCount: number
}

const MAX_ROWS = 50_000

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

    // Use first sheet named "Datos" if present; otherwise the first sheet.
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
      raw: false,         // format dates as strings
      dateNF: "yyyy-mm-dd",
    })

    if (raw.length < 2) {
      return empty("El archivo no contiene filas de datos (mínimo: 1 encabezado + 1 fila).")
    }

    const [headerRow, ...dataRows] = raw
    const headers = (headerRow as unknown[]).map((h) =>
      String(h ?? "").trim()
    )

    const { columnMap, unmappedHeaders } = buildColumnMap(headers, schema)

    // Reject if zero required fields were mapped
    const requiredFields = schema.fields.filter((f) => f.required)
    const mappedKeys = new Set(Object.keys(columnMap))
    const missingRequired = requiredFields.filter((f) => !mappedKeys.has(f.key))
    if (missingRequired.length > 0) {
      return empty(
        `No se encontraron columnas requeridas: ${missingRequired.map((f) => `"${f.label}"`).join(", ")}. Verifica que los encabezados coincidan con la plantilla.`
      )
    }

    // Map each row to keyed object
    const headerIndexMap = Object.fromEntries(
      headers.map((h, i) => [h, i])
    ) as Record<string, number>

    const inverseColumnMap: Record<string, string> = Object.fromEntries(
      Object.entries(columnMap).map(([key, header]) => [header, key])
    )

    const limitedRows = dataRows.slice(0, MAX_ROWS)
    const rows: ParsedRow[] = []

    for (const rawRow of limitedRows) {
      const arr = rawRow as unknown[]
      const row: ParsedRow = {}
      for (const [fieldKey, header] of Object.entries(columnMap)) {
        const colIdx = headerIndexMap[header]
        const raw = colIdx !== undefined ? arr[colIdx] : undefined
        row[fieldKey] = coerceValue(raw, schema.fields.find((f) => f.key === fieldKey)!)
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
  return { ok: false, rows: [], columnMap: {}, unmappedHeaders: [], error, rawRowCount: 0 }
}

/**
 * Build a mapping from schema field key → spreadsheet column header.
 *
 * Match priority (first hit wins):
 *  1. Exact label match  (e.g. "Tipo de venta")
 *  2. Exact key match    (e.g. "sales_type")
 *  3. Normalized match   (lowercase + accent-stripped label or key)
 *  4. Legacy alias match (schema.columnAliases — maps old header → field key)
 */
function buildColumnMap(
  headers: string[],
  schema: TableSchema
): { columnMap: Record<string, string>; unmappedHeaders: string[] } {
  const columnMap: Record<string, string> = {}
  const usedHeaders = new Set<string>()

  // Build a reverse alias map: header string → field key
  // e.g. { channel: "sales_type", Canal: "sales_type" }
  const aliasToKey: Record<string, string> = schema.columnAliases ?? {}

  for (const field of schema.fields) {
    // 1. Exact label match
    let match = headers.find((h) => h === field.label)
    // 2. Exact key match
    if (!match) match = headers.find((h) => h === field.key)
    // 3. Normalized match (lowercase, accent-stripped)
    if (!match) {
      const normalizedLabel = normalize(field.label)
      const normalizedKey = field.key.toLowerCase()
      match = headers.find(
        (h) => normalize(h) === normalizedLabel || normalize(h) === normalizedKey
      )
    }
    if (match) {
      columnMap[field.key] = match
      usedHeaders.add(match)
    }
  }

  // 4. Legacy alias pass — handle renamed columns from older templates.
  // For each unmatched alias header in the file, resolve it to the current
  // field key and add the mapping if that field hasn't already been matched.
  for (const header of headers) {
    if (usedHeaders.has(header)) continue           // already mapped
    const targetKey = aliasToKey[header]
    if (!targetKey) continue                        // not a known alias
    if (columnMap[targetKey]) continue              // target already mapped via a better match
    columnMap[targetKey] = header
    usedHeaders.add(header)
  }

  const unmappedHeaders = headers.filter((h) => h && !usedHeaders.has(h))

  return { columnMap, unmappedHeaders }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
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
      // If xlsx parsed it as a JS Date object (cellDates: true)
      if (raw instanceof Date) return raw.toISOString().slice(0, 10)
      // Try DD/MM/YYYY
      const ddmm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
      if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`
      // Already YYYY-MM-DD or similar
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      return s
    }
    case "string":
    default:
      return s
  }
}
