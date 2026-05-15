import { supabase } from "@/lib/supabase"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"

/**
 * Supabase query layer for the FIR-KPI dashboard.
 *
 * Each fetcher accepts an optional `DashboardFilters` argument and translates
 * the active filters into `.eq()` / date-range constraints on the underlying
 * Supabase view. The per-view `ViewSupport` map declares which filter keys
 * the view can honor — filters outside that set are silently ignored.
 *
 * Exact view schemas (single source of truth):
 *
 *   sales_kpi_monthly
 *     month, senior_seller, junior_seller, zone, territory, sales_type,
 *     customer_group, customer_subgroup, customer_segment, product_family,
 *     net_sales, total_quantity, total_cost, gross_profit, gross_margin
 *
 *   orders_pending_kpi
 *     month, seller_name, customer_code, customer_name, customer_group,
 *     customer_subgroup, customer_segment, destination_city, product_family,
 *     order_type, ordered_quantity, invoiced_quantity, pending_quantity,
 *     total_order_value
 *
 *   open_deliveries_kpi
 *     month, seller_name, customer_code, customer_name, customer_group,
 *     customer_subgroup, customer_segment, city, product_family, order_type,
 *     delivered_quantity, open_delivery_value
 *
 *   overdue_orders, blocked_orders, deliveries_with_issues,
 *   deliveries_pending_pod
 *     Treated as raw list/count views; the row count IS the KPI. Without a
 *     confirmed schema, no filters are applied to these four.
 *
 * Notes on `fetchSalesMonthly`:
 *   `sales_kpi_monthly` is granular by dimension, so we sum `net_sales` per
 *   `month` client-side. The schema has no `budget` column, so the budget
 *   series is synthesized from a 3-month trailing average × 1.08 — swap in a
 *   real budget view when one becomes available.
 */

// ---------- Public, normalized types --------------------------------------

export type SalesMonth = {
  /** YYYY-MM, normalized for stable sort + locale-agnostic labelling. */
  month: string
  /** Aggregated net_sales for the month, summed across dimensions. */
  sales: number
  /** Synthesized budget target — see header docblock. */
  budget: number
}

// ---------- Helpers -------------------------------------------------------

function toMonthKey(raw: string): string {
  let m = /^(\d{4})-(\d{2})/.exec(raw)
  if (m) return `${m[1]}-${m[2]}`
  m = /^(\d{4})\/(\d{2})/.exec(raw)
  if (m) return `${m[1]}-${m[2]}`
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear()
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0")
    return `${y}-${mo}`
  }
  return raw
}

function asNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function trailingAverage(values: number[], i: number, window = 3): number {
  const start = Math.max(0, i - window)
  const slice = values.slice(start, i)
  if (slice.length === 0) return values[i] ?? 0
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/* ---------- Filter translation ---------- */

type MonthRange = { gte: string; lt: string }

/**
 * Translate (year, month) filter values into a half-open date range
 * `[gte, lt)`. Works for both `date` and `text` (lexicographic) columns
 * because we use canonical `YYYY-MM-DD` strings.
 *
 * - year + month → one calendar month
 * - year only    → one calendar year
 * - month only   → not supported (rare cross-year slice); ignored
 */
function monthRange(
  year: string | null,
  month: string | null
): MonthRange | null {
  const pad = (n: number) => String(n).padStart(2, "0")
  if (year && month) {
    const y = Number(year)
    const m = Number(month)
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      return null
    }
    const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }
    return {
      gte: `${y}-${pad(m)}-01`,
      lt: `${next.y}-${pad(next.m)}-01`,
    }
  }
  if (year) {
    const y = Number(year)
    if (!Number.isFinite(y)) return null
    return { gte: `${y}-01-01`, lt: `${y + 1}-01-01` }
  }
  return null
}

/**
 * Per-view capability map. Only keys listed here are applied — missing keys
 * are silently ignored. This is the single place to extend when new columns
 * appear on a Supabase view.
 */
type ViewSupport = {
  /** Date / month column on the view, if filterable. */
  monthColumn?: string
  /** Concrete seller column (varies per view). */
  sellerColumn?: string
  zone?: boolean
  territory?: boolean
  /** Concrete channel column ("sales_type" or "order_type"). */
  channelColumn?: string
  productFamily?: boolean
  customerGroup?: boolean
  customerSubgroup?: boolean
  customerSegment?: boolean
}

/**
 * Apply a `DashboardFilters` object to a Postgrest query builder according to
 * the view's declared `ViewSupport`. Returns the same chained builder.
 *
 * We use `unknown` for the builder type because Postgrest's generic chain
 * types are complex and unstable across supabase-js patches; the cast is
 * confined to this single helper.
 */
function applyFilters<Q>(
  query: Q,
  filters: DashboardFilters,
  support: ViewSupport
): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query

  if (support.monthColumn) {
    const range = monthRange(filters.year, filters.month)
    if (range) {
      q = q.gte(support.monthColumn, range.gte).lt(support.monthColumn, range.lt)
    }
  }
  if (support.sellerColumn && filters.seller) {
    q = q.eq(support.sellerColumn, filters.seller)
  }
  if (support.zone && filters.zone) q = q.eq("zone", filters.zone)
  if (support.territory && filters.territory) {
    q = q.eq("territory", filters.territory)
  }
  if (support.channelColumn && filters.channel) {
    q = q.eq(support.channelColumn, filters.channel)
  }
  if (support.productFamily && filters.productFamily) {
    q = q.eq("product_family", filters.productFamily)
  }
  if (support.customerGroup && filters.customerGroup) {
    q = q.eq("customer_group", filters.customerGroup)
  }
  if (support.customerSubgroup && filters.customerSubgroup) {
    q = q.eq("customer_subgroup", filters.customerSubgroup)
  }
  if (support.customerSegment && filters.customerSegment) {
    q = q.eq("customer_segment", filters.customerSegment)
  }
  return q as Q
}

/* ---------- View-support presets ---------- */

const SUPPORT_SALES: ViewSupport = {
  monthColumn: "month",
  sellerColumn: "senior_seller",
  zone: true,
  territory: true,
  channelColumn: "sales_type",
  productFamily: true,
  customerGroup: true,
  customerSubgroup: true,
  customerSegment: true,
}

const SUPPORT_ORDERS: ViewSupport = {
  monthColumn: "month",
  sellerColumn: "seller_name",
  channelColumn: "order_type",
  productFamily: true,
  customerGroup: true,
  customerSubgroup: true,
  customerSegment: true,
}

const SUPPORT_DELIVERIES: ViewSupport = {
  monthColumn: "month",
  sellerColumn: "seller_name",
  channelColumn: "order_type",
  productFamily: true,
  customerGroup: true,
  customerSubgroup: true,
  customerSegment: true,
}

/* ---------- Count helper ---------- */

async function exactRowCount(
  view: string,
  filters?: DashboardFilters,
  support?: ViewSupport
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from(view)
    .select("*", { count: "exact", head: true })
  if (filters && support) {
    q = applyFilters(q, filters, support)
  }
  const { count, error } = await q
  if (error) throw error
  return typeof count === "number" ? count : 0
}

// ---------- sales_kpi_monthly ---------------------------------------------

type SalesAggRow = {
  month: string | null
  net_sales: number | string | null
}

export async function fetchSalesMonthly(
  filters?: DashboardFilters
): Promise<SalesMonth[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("sales_kpi_monthly")
    .select("month, net_sales")
  if (filters) q = applyFilters(q, filters, SUPPORT_SALES)

  const { data, error } = await q
  if (error) throw error
  const rows = (data ?? []) as SalesAggRow[]
  if (rows.length === 0) return []

  // Aggregate per month (the view is granular by dimension).
  const byMonth = new Map<string, number>()
  for (const r of rows) {
    if (!r.month) continue
    const key = toMonthKey(String(r.month))
    byMonth.set(key, (byMonth.get(key) ?? 0) + asNumber(r.net_sales))
  }
  if (byMonth.size === 0) return []

  const sortedKeys = [...byMonth.keys()].sort()
  const recent = sortedKeys.slice(-12)
  const salesSeries = recent.map((k) => byMonth.get(k) ?? 0)

  // Synthesize a budget target (see file header).
  return recent.map((month, i) => {
    const trail = trailingAverage(salesSeries, i, 3)
    const budget = Math.round(trail * 1.08)
    return { month, sales: salesSeries[i], budget }
  })
}

// ---------- orders_pending_kpi --------------------------------------------

export function fetchPendingOrders(
  filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("orders_pending_kpi", filters, SUPPORT_ORDERS)
}

// ---------- open_deliveries_kpi -------------------------------------------

export function fetchOpenDeliveries(
  filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("open_deliveries_kpi", filters, SUPPORT_DELIVERIES)
}

// ---------- overdue_orders / blocked_orders / issues / pending_pod --------
//
// These four views have no confirmed schema, so filters are intentionally not
// applied. They will return raw counts irrespective of the active filter set.
// Add a `ViewSupport` entry below when their column lists are confirmed.

export function fetchOverdueOrders(
  _filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("overdue_orders")
}

export function fetchBlockedOrders(
  _filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("blocked_orders")
}

export function fetchDeliveriesWithIssues(
  _filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("deliveries_with_issues")
}

export function fetchDeliveriesPendingPod(
  _filters?: DashboardFilters
): Promise<number> {
  return exactRowCount("deliveries_pending_pod")
}

/* =========================================================================
 * Row-level fetchers — power the KPI drilldown sheets.
 *
 * They reuse the same `applyFilters` + `ViewSupport` plumbing as the KPI
 * counters, so every filter the dashboard surfaces is already honored.
 * `DRILLDOWN_LIMIT` keeps the payload bounded; the drilldown table paginates
 * client-side from the returned slice.
 * ========================================================================= */

const DRILLDOWN_LIMIT = 1000

export type SalesRow = {
  month: string | null
  senior_seller: string | null
  junior_seller: string | null
  zone: string | null
  territory: string | null
  sales_type: string | null
  customer_group: string | null
  customer_subgroup: string | null
  customer_segment: string | null
  product_family: string | null
  net_sales: number | string | null
  total_quantity: number | string | null
  total_cost: number | string | null
  gross_profit: number | string | null
  gross_margin: number | string | null
}

export type PendingOrderRow = {
  month: string | null
  seller_name: string | null
  customer_code: string | null
  customer_name: string | null
  customer_group: string | null
  customer_subgroup: string | null
  customer_segment: string | null
  destination_city: string | null
  product_family: string | null
  order_type: string | null
  ordered_quantity: number | string | null
  invoiced_quantity: number | string | null
  pending_quantity: number | string | null
  total_order_value: number | string | null
}

export type OpenDeliveryRow = {
  month: string | null
  seller_name: string | null
  customer_code: string | null
  customer_name: string | null
  customer_group: string | null
  customer_subgroup: string | null
  customer_segment: string | null
  city: string | null
  product_family: string | null
  order_type: string | null
  delivered_quantity: number | string | null
  open_delivery_value: number | string | null
}

/** Schema unknown — pass through as a raw record so the table can auto-derive columns. */
export type OverdueOrderRow = Record<string, string | number | boolean | null>

export async function fetchSalesRows(
  filters?: DashboardFilters
): Promise<SalesRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("sales_kpi_monthly")
    .select("*")
    .limit(DRILLDOWN_LIMIT)
  if (filters) q = applyFilters(q, filters, SUPPORT_SALES)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as SalesRow[]
}

export async function fetchPendingOrdersRows(
  filters?: DashboardFilters
): Promise<PendingOrderRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("orders_pending_kpi")
    .select("*")
    .limit(DRILLDOWN_LIMIT)
  if (filters) q = applyFilters(q, filters, SUPPORT_ORDERS)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as PendingOrderRow[]
}

export async function fetchOpenDeliveriesRows(
  filters?: DashboardFilters
): Promise<OpenDeliveryRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("open_deliveries_kpi")
    .select("*")
    .limit(DRILLDOWN_LIMIT)
  if (filters) q = applyFilters(q, filters, SUPPORT_DELIVERIES)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as OpenDeliveryRow[]
}

/**
 * `overdue_orders` has no confirmed schema, so we return a plain record array
 * and the drilldown table auto-derives column definitions from the first row.
 */
export async function fetchOverdueOrdersRows(
  _filters?: DashboardFilters
): Promise<OverdueOrderRow[]> {
  const { data, error } = await supabase
    .from("overdue_orders")
    .select("*")
    .limit(DRILLDOWN_LIMIT)
  if (error) throw error
  return (data ?? []) as OverdueOrderRow[]
}
