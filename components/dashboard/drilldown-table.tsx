"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { t } from "@/lib/i18n"

/* --------------------------- types --------------------------- */

export type CellFormat = "text" | "number" | "currency" | "percent" | "auto"

export type ColumnDef<T> = {
  /** Snake_case key used for the column header lookup AND CSV header. */
  key: string
  /** Optional override; if omitted, uses t.drilldown.columns[key] or humanizes the key. */
  label?: string
  align?: "left" | "right"
  /** Compute a sortable / searchable scalar. Defaults to row[key]. */
  accessor?: (row: T) => string | number | null
  /** Custom cell renderer. Falls back to formatted accessor value. */
  cell?: (row: T) => React.ReactNode
  /** Built-in formatter applied to accessor value when `cell` is not provided. */
  format?: CellFormat
  /** Hide the column on narrow viewports. */
  hideOnMobile?: boolean
  /** Disable sorting for this column. */
  sortable?: boolean
}

export type DrilldownTableProps<T extends Record<string, unknown>> = {
  rows: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: Error | null
  pageSize?: number
  exportFilename?: string
  searchPlaceholder?: string
  className?: string
}

/* --------------------------- helpers --------------------------- */

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function labelFor<T>(col: ColumnDef<T>): string {
  if (col.label) return col.label
  const dict = t.drilldown.columns as Record<string, string>
  return dict[col.key] ?? humanize(col.key)
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function readValue<T extends Record<string, unknown>>(
  row: T,
  col: ColumnDef<T>
): string | number | null {
  if (col.accessor) return col.accessor(row)
  const v = row[col.key as keyof T]
  if (v == null) return null
  if (typeof v === "number" || typeof v === "string") return v
  return String(v)
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${Math.round(value).toLocaleString()}`
}

function formatPercent(value: number): string {
  // The DB sometimes stores margins as fractions (0.32) and sometimes as
  // percentages already (32). Treat |v| ≤ 1 as fraction.
  const pct = Math.abs(value) <= 1 ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

function formatNumber(value: number): string {
  return value.toLocaleString()
}

function renderCell<T extends Record<string, unknown>>(
  row: T,
  col: ColumnDef<T>
): React.ReactNode {
  if (col.cell) return col.cell(row)
  const raw = readValue(row, col)
  if (raw == null || raw === "") return <span className="text-muted-foreground">—</span>
  const format = col.format ?? "auto"
  const num = typeof raw === "number" ? raw : asNumber(raw)
  if ((format === "currency") && num != null) return formatCurrency(num)
  if (format === "percent" && num != null) return formatPercent(num)
  if (format === "number" && num != null) return formatNumber(num)
  if (format === "auto" && num != null && typeof raw === "number") return formatNumber(num)
  return String(raw)
}

function compareValues(
  a: string | number | null,
  b: string | number | null,
  dir: "asc" | "desc"
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  let cmp: number
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b
  } else {
    cmp = String(a).localeCompare(String(b), undefined, { numeric: true })
  }
  return dir === "asc" ? cmp : -cmp
}

function escapeCsv(input: string): string {
  return /[",\n\r]/.test(input) ? `"${input.replace(/"/g, '""')}"` : input
}

function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: ColumnDef<T>[]
): string {
  const header = columns.map((c) => escapeCsv(labelFor(c))).join(",")
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = readValue(row, c)
        return escapeCsv(v == null ? "" : String(v))
      })
      .join(",")
  )
  return [header, ...lines].join("\n")
}

function downloadCsv(filename: string, csv: string) {
  if (typeof document === "undefined") return
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* --------------------------- component --------------------------- */

export function DrilldownTable<T extends Record<string, unknown>>({
  rows,
  columns,
  loading = false,
  error = null,
  pageSize = 10,
  exportFilename = "drilldown.csv",
  searchPlaceholder,
  className,
}: DrilldownTableProps<T>) {
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")

  // Reset to first page whenever the underlying data or filters change.
  React.useEffect(() => {
    setPage(0)
  }, [rows, query, sortKey, sortDir])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) =>
      columns.some((col) => {
        const v = readValue(row, col)
        return v != null && String(v).toLowerCase().includes(q)
      })
    )
  }, [rows, query, columns])

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return filtered
    const list = [...filtered]
    list.sort((a, b) => compareValues(readValue(a, col), readValue(b, col), sortDir))
    return list
  }, [filtered, columns, sortKey, sortDir])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const pageRows = sorted.slice(start, start + pageSize)

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const handleExport = () => {
    downloadCsv(exportFilename, toCsv(sorted, columns))
  }

  /* ------------------------- render ------------------------- */

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder ?? t.drilldown.search}
            aria-label={t.drilldown.search}
            className="h-9 w-full rounded-xl border border-foreground/10 bg-background/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground outline-none backdrop-blur-xl transition-colors hover:bg-background/60 focus:border-foreground/20 focus:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {t.drilldown.rowsShown
              .replace("{shown}", String(total))
              .replace("{total}", String(rows.length))}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading || total === 0}
            className="gap-1.5"
            aria-label={t.drilldown.exportCsv}
          >
            <Download className="size-3.5" />
            {t.drilldown.exportCsv}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-subtle scrollbar-thin relative flex-1 overflow-auto rounded-xl">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl">
            <TableRow>
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const sortable = col.sortable !== false
                const Indicator = !sortable
                  ? null
                  : isSorted
                    ? sortDir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "h-10 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground",
                      col.align === "right" ? "text-right" : "text-left",
                      col.hideOnMobile && "hidden md:table-cell"
                    )}
                    aria-sort={
                      isSorted
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : sortable
                          ? "none"
                          : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key, sortable)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                          col.align === "right" && "flex-row-reverse"
                        )}
                      >
                        {labelFor(col)}
                        {Indicator ? <Indicator className="size-3" /> : null}
                      </button>
                    ) : (
                      labelFor(col)
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(col.hideOnMobile && "hidden md:table-cell")}
                    >
                      <span
                        aria-hidden
                        className="block h-4 w-full max-w-32 animate-pulse rounded bg-foreground/10"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {error?.message ??
                    (query ? t.drilldown.noResults : t.drilldown.empty)}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, idx) => (
                <TableRow key={`row-${start + idx}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "text-sm",
                        col.align === "right" && "text-right tabular-nums",
                        col.hideOnMobile && "hidden md:table-cell"
                      )}
                    >
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground sm:hidden">
          {t.drilldown.rowsShown
            .replace("{shown}", String(total))
            .replace("{total}", String(rows.length))}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {t.drilldown.pageOf
              .replace("{page}", String(safePage + 1))
              .replace("{total}", String(totalPages))}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0 || loading || total === 0}
              aria-label={t.drilldown.prev}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1 || loading || total === 0}
              aria-label={t.drilldown.next}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper to derive a column list from the first sample row when no explicit
 * column definitions exist (used by the overdue_orders drilldown).
 */
export function autoColumnsFromRow<T extends Record<string, unknown>>(
  sample: T | undefined
): ColumnDef<T>[] {
  if (!sample) return []
  return Object.keys(sample).map((k) => {
    const v = sample[k]
    const numeric = typeof v === "number" || (typeof v === "string" && !Number.isNaN(Number(v)) && v !== "")
    return {
      key: k,
      align: numeric ? "right" : "left",
      format: numeric ? "auto" : "text",
    }
  })
}
