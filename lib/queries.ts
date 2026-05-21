import { supabase } from "@/lib/supabase"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"
import { getSalesByMonth, type SalesMonth } from "@/lib/supabase/sales-fact"

/**
 * Supabase query layer for the FIR-KPI dashboard.
 *
 * Sales data (`fetchSalesMonthly`) is now fetched directly from `sales_fact`
 * via lib/supabase/sales-fact.ts — no Supabase views required.
 *
 * Operational count fetchers (`fetchPendingOrders`, etc.) still query their
 * respective Supabase views. A ViewSupport map controls which DashboardFilters
 * keys each view honours.
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
 *     Treated as raw list/count views — row count IS the KPI. No filter
 *     support until their column lists are confirmed.
 */

// ---------- Public, normalized types --------------------------------------

// Re-exported so existing consumers (sales-chart.tsx etc.) keep working.
export type { SalesMonth } from "@/lib/supabase/sales-fact"

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

// ---------- sales_fact (direct) -------------------------------------------

/**
 * Fetch monthly sales aggregates directly from `sales_fact`.
 * Delegates to lib/supabase/sales-fact.ts — no Supabase view required.
 */
export async function fetchSalesMonthly(
  filters?: DashboardFilters
): Promise<SalesMonth[]> {
  return getSalesByMonth(filters)
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
