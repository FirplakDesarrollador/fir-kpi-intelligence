/**
 * Centralized data layer for sales_fact.
 *
 * All functions query the `sales_fact` table directly using the confirmed
 * 39-column schema (see lib/data-import/header-maps.ts). No views are used,
 * so this layer works regardless of whether Supabase views have been created.
 *
 * Filter mapping (DashboardFilters key → sales_fact column):
 *   year / month   → document_date range
 *   seller         → senior_seller
 *   zone           → zone
 *   territory      → territory
 *   channel        → sales_type   ← "channel" UI key maps to sales_type column
 *   productFamily  → product_family
 *   customerGroup  → customer_group
 *   customerSubgroup → customer_subgroup
 *   customerSegment  → customer_segment
 */

import { supabase } from "@/lib/supabase"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"

// ── Shared types ──────────────────────────────────────────────────────────────

/** Filter-select option. Source of truth — components import from here. */
export type FilterOption = { value: string; label: string }

/** Monthly aggregated sales row (same shape as the legacy view-based type). */
export type SalesMonth = {
  /** YYYY-MM — stable sort key and locale-agnostic label. */
  month: string
  /** Sum of total_value for all sales_fact rows in this month. */
  sales: number
  /** Synthesized budget — 3-month trailing average × 1.08. */
  budget: number
}

/** Period-level KPI totals. */
export type SalesKPIs = {
  netSales: number
  totalCost: number
  grossProfit: number
  /** Gross margin as a percentage (0–100). */
  grossMargin: number
  rowCount: number
}

/** All distinct dimension values, ready to populate filter dropdowns. */
export type SalesFilterOptions = {
  years: FilterOption[]
  months: FilterOption[]
  zones: FilterOption[]
  territories: FilterOption[]
  seniorSellers: FilterOption[]
  juniorSellers: FilterOption[]
  productFamilies: FilterOption[]
  salesTypes: FilterOption[]
  customerGroups: FilterOption[]
  customerSubgroups: FilterOption[]
  customerSegments: FilterOption[]
}

// ── Internal constants ────────────────────────────────────────────────────────

const ES_MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

/**
 * Maximum rows fetched per aggregation query. Keeps payloads bounded while
 * covering the expected data volumes for a mid-sized business.
 */
const AGG_LIMIT = 100_000

/**
 * Maximum rows fetched per distinct-column query.
 * A single text column × 10 K rows ≈ 100–200 KB — well within browser limits.
 */
const COL_LIMIT = 10_000

// ── Filter helper ─────────────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

/**
 * Applies active DashboardFilters to a Supabase/PostgREST query builder,
 * translating camelCase filter keys to the actual sales_fact column names.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(q: any, filters: DashboardFilters): any {
  const {
    year,
    month,
    seller,
    zone,
    territory,
    channel,
    productFamily,
    customerGroup,
    customerSubgroup,
    customerSegment,
  } = filters

  // Date range derived from year + optional month
  if (year && month) {
    const y = Number(year)
    const m = Number(month)
    const nextM = m === 12 ? 1 : m + 1
    const nextY = m === 12 ? y + 1 : y
    q = q
      .gte("document_date", `${y}-${pad2(m)}-01`)
      .lt("document_date", `${nextY}-${pad2(nextM)}-01`)
  } else if (year) {
    const y = Number(year)
    q = q
      .gte("document_date", `${y}-01-01`)
      .lt("document_date", `${y + 1}-01-01`)
  }

  if (seller) q = q.eq("senior_seller", seller)
  if (zone) q = q.eq("zone", zone)
  if (territory) q = q.eq("territory", territory)
  if (channel) q = q.eq("sales_type", channel) // "channel" UI key → sales_type column
  if (productFamily) q = q.eq("product_family", productFamily)
  if (customerGroup) q = q.eq("customer_group", customerGroup)
  if (customerSubgroup) q = q.eq("customer_subgroup", customerSubgroup)
  if (customerSegment) q = q.eq("customer_segment", customerSegment)

  return q
}

// ── Query functions ───────────────────────────────────────────────────────────

/**
 * Aggregate `total_value` from sales_fact by calendar month.
 *
 * Returns up to 24 months sorted ascending. A synthesized budget series is
 * computed as the 3-month trailing average of sales × 1.08 — replace this
 * with a real budget view when one becomes available.
 *
 * The most-recent AGG_LIMIT rows are fetched (ordered by date descending),
 * so very large tables will prefer recent data over historical.
 */
export async function getSalesByMonth(
  filters?: DashboardFilters
): Promise<SalesMonth[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("sales_fact")
    .select("document_date, total_value")
    .order("document_date", { ascending: false })
    .limit(AGG_LIMIT)

  if (filters) q = applyFilters(q, filters)

  const { data, error } = await q
  if (error) throw error

  const rows = (data ?? []) as Array<{
    document_date: string | null
    total_value: string | number | null
  }>
  if (rows.length === 0) return []

  // Group by YYYY-MM
  const byMonth = new Map<string, number>()
  for (const r of rows) {
    if (!r.document_date) continue
    const key = String(r.document_date).slice(0, 7) // "YYYY-MM"
    byMonth.set(key, (byMonth.get(key) ?? 0) + (Number(r.total_value) || 0))
  }
  if (byMonth.size === 0) return []

  const sortedKeys = [...byMonth.keys()].sort()
  const recent = sortedKeys.slice(-24)
  const salesSeries = recent.map((k) => byMonth.get(k) ?? 0)

  return recent.map((month, i) => {
    const start = Math.max(0, i - 3)
    const slice = salesSeries.slice(start, i)
    const trail =
      slice.length > 0
        ? slice.reduce((a, b) => a + b, 0) / slice.length
        : (salesSeries[i] ?? 0)
    return { month, sales: salesSeries[i], budget: Math.round(trail * 1.08) }
  })
}

/**
 * Period-level KPI totals — net sales, cost, gross profit, and margin.
 * Useful for summary cards that need absolute values rather than a time series.
 */
export async function getSalesKPIs(
  filters?: DashboardFilters
): Promise<SalesKPIs> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("sales_fact")
    .select("total_value, total_cost, gross_profit")
    .limit(AGG_LIMIT)

  if (filters) q = applyFilters(q, filters)

  const { data, error } = await q
  if (error) throw error

  const rows = (data ?? []) as Array<{
    total_value: number | string | null
    total_cost: number | string | null
    gross_profit: number | string | null
  }>

  let netSales = 0
  let totalCost = 0
  let grossProfitSum = 0

  for (const r of rows) {
    netSales += Number(r.total_value) || 0
    totalCost += Number(r.total_cost) || 0
    grossProfitSum += Number(r.gross_profit) || 0
  }

  const grossMargin = netSales > 0 ? (grossProfitSum / netSales) * 100 : 0

  return {
    netSales,
    totalCost,
    grossProfit: grossProfitSum,
    grossMargin,
    rowCount: rows.length,
  }
}

/**
 * Fetch distinct values for every dashboard filter dimension from sales_fact.
 *
 * All column queries run in parallel. Each fetches up to COL_LIMIT rows of a
 * single column, then deduplicates client-side — very fast for a single-column
 * payload. Years and months are derived from the `document_date` column.
 */
export async function getSalesFilters(): Promise<SalesFilterOptions> {
  /**
   * Fetch up to COL_LIMIT non-null, non-empty values for a single column,
   * then return the sorted unique set.
   */
  async function distinctValues(col: string): Promise<string[]> {
    const { data } = await supabase
      .from("sales_fact")
      .select(col)
      .not(col, "is", null)
      .neq(col, "")
      .limit(COL_LIMIT)

    const seen = new Set<string>()
    for (const row of data ?? []) {
      const r = row as unknown as Record<string, unknown>
      const v = String(r[col] ?? "").trim()
      if (v) seen.add(v)
    }
    return [...seen].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    )
  }

  // Run all queries in parallel.
  const [
    dateResult,
    zones,
    territories,
    seniorSellers,
    juniorSellers,
    productFamilies,
    salesTypes,
    customerGroups,
    customerSubgroups,
    customerSegments,
  ] = await Promise.all([
    supabase
      .from("sales_fact")
      .select("document_date")
      .not("document_date", "is", null)
      .limit(COL_LIMIT),
    distinctValues("zone"),
    distinctValues("territory"),
    distinctValues("senior_seller"),
    distinctValues("junior_seller"),
    distinctValues("product_family"),
    distinctValues("sales_type"),
    distinctValues("customer_group"),
    distinctValues("customer_subgroup"),
    distinctValues("customer_segment"),
  ])

  // Derive distinct years and months from the document_date column.
  const yearSet = new Set<string>()
  const monthSet = new Set<string>()
  for (const row of dateResult.data ?? []) {
    const d = String(
      (row as unknown as Record<string, unknown>).document_date ?? ""
    )
    if (d.length >= 10) {
      yearSet.add(d.slice(0, 4)) // "YYYY"
      monthSet.add(d.slice(5, 7)) // "MM"
    }
  }

  const years: FilterOption[] = [...yearSet]
    .sort()
    .reverse()
    .map((y) => ({ value: y, label: y }))

  const months: FilterOption[] = [...monthSet]
    .sort()
    .map((m) => ({
      value: m,
      label: ES_MONTH_NAMES[Number(m) - 1] ?? m,
    }))

  const toOpts = (vals: string[]): FilterOption[] =>
    vals.map((v) => ({ value: v, label: v }))

  return {
    years,
    months,
    zones: toOpts(zones),
    territories: toOpts(territories),
    seniorSellers: toOpts(seniorSellers),
    juniorSellers: toOpts(juniorSellers),
    productFamilies: toOpts(productFamilies),
    salesTypes: toOpts(salesTypes),
    customerGroups: toOpts(customerGroups),
    customerSubgroups: toOpts(customerSubgroups),
    customerSegments: toOpts(customerSegments),
  }
}
