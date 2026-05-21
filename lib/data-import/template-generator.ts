/**
 * Excel template generator — client-side only.
 *
 * Generates a .xlsx file with two sheets:
 *  1. "Datos"       — header row uses EXACT DB column names + one example row.
 *                     Users fill from row 3 onward.
 *  2. "Diccionario" — full field reference: column name, Spanish label, type,
 *                     required flag, and example value.
 *
 * The "Datos" headers match the Supabase column names exactly so uploaded
 * files can be parsed without any label-to-column mapping.
 *
 * Uses the `xlsx` (SheetJS) package which is safe to bundle in the browser.
 * This module must NOT be imported in Server Components or Route Handlers.
 */

import * as XLSX from "xlsx"
import type { TableSchema } from "./schema-definitions"

/** Download a .xlsx template for the given table schema. */
export function downloadTemplate(schema: TableSchema): void {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Datos ────────────────────────────────────────────────────────
  // Headers are the exact DB column names — no Spanish labels, no mapping needed.
  const headers = schema.fields.map((f) => f.key)
  const exampleRow = schema.fields.map((f) => f.example ?? "")

  const datosWs = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Column widths
  datosWs["!cols"] = schema.fields.map((f) => ({
    wch: Math.max(f.key.length + 4, 18),
  }))

  // Style the header row bold (SheetJS Community Edition doesn't support full
  // cell styles, but we mark the row as frozen so it stays visible while scrolling)
  datosWs["!freeze"] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, datosWs, "Datos")

  // ── Sheet 2: Diccionario ──────────────────────────────────────────────────
  const dictHeaders = [
    "Campo (columna)",
    "Etiqueta",
    "Tipo",
    "Requerido",
    "Ejemplo",
    "Descripción",
  ]
  const dictRows = schema.fields.map((f) => [
    f.key,
    f.label,
    translateType(f.type),
    f.required ? "Sí" : "No",
    f.example ?? "",
    buildFieldDescription(f),
  ])

  const dictWs = XLSX.utils.aoa_to_sheet([dictHeaders, ...dictRows])
  dictWs["!cols"] = [
    { wch: 28 }, // campo
    { wch: 30 }, // etiqueta
    { wch: 12 }, // tipo
    { wch: 12 }, // requerido
    { wch: 22 }, // ejemplo
    { wch: 45 }, // descripción
  ]

  XLSX.utils.book_append_sheet(wb, dictWs, "Diccionario")

  // ── Trigger download ──────────────────────────────────────────────────────
  const fileName = `plantilla_${schema.table}_${todayIso()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function translateType(type: string): string {
  const map: Record<string, string> = {
    string: "Texto",
    number: "Número",
    date: "Fecha (YYYY-MM-DD)",
    boolean: "Booleano (true/false)",
  }
  return map[type] ?? type
}

function buildFieldDescription(f: {
  key: string
  type: string
  required: boolean
}): string {
  const parts: string[] = []
  if (f.required) parts.push("Campo obligatorio.")
  if (f.type === "date") parts.push("Formato: YYYY-MM-DD o DD/MM/YYYY.")
  if (f.type === "boolean") parts.push("Usar: true / false / 1 / 0.")
  if (f.type === "number") parts.push("Solo números. Separador decimal: punto.")
  return parts.join(" ")
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
