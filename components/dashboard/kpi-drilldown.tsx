"use client"

import * as React from "react"

import {
  DrilldownTable,
  autoColumnsFromRow,
  type ColumnDef,
} from "@/components/dashboard/drilldown-table"
import { KpiDetailSheet } from "@/components/dashboard/kpi-detail-sheet"
import { type IconName } from "@/components/icons"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { t, type DrilldownId } from "@/lib/i18n"
import {
  fetchOpenDeliveriesRows,
  fetchOverdueOrdersRows,
  fetchPendingOrdersRows,
  fetchSalesRows,
  type OpenDeliveryRow,
  type OverdueOrderRow,
  type PendingOrderRow,
  type SalesRow,
} from "@/lib/queries"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"

/* ----------------------------------------------------------------
 *  Per-KPI column definitions.
 *
 *  Each set mirrors the Supabase view schema exactly. Hidden-on-mobile
 *  columns are dimension-level breakdowns kept on wider screens.
 * ---------------------------------------------------------------- */

const SALES_COLUMNS: ColumnDef<SalesRow>[] = [
  { key: "month" },
  { key: "senior_seller" },
  { key: "junior_seller", hideOnMobile: true },
  { key: "zone", hideOnMobile: true },
  { key: "territory", hideOnMobile: true },
  { key: "sales_type", hideOnMobile: true },
  { key: "product_family" },
  { key: "customer_group", hideOnMobile: true },
  { key: "customer_subgroup", hideOnMobile: true },
  { key: "customer_segment", hideOnMobile: true },
  { key: "net_sales", align: "right", format: "currency" },
  { key: "total_quantity", align: "right", format: "number", hideOnMobile: true },
  { key: "total_cost", align: "right", format: "currency", hideOnMobile: true },
  { key: "gross_profit", align: "right", format: "currency", hideOnMobile: true },
  { key: "gross_margin", align: "right", format: "percent" },
]

const PENDING_COLUMNS: ColumnDef<PendingOrderRow>[] = [
  { key: "month" },
  { key: "seller_name" },
  { key: "customer_code", hideOnMobile: true },
  { key: "customer_name" },
  { key: "customer_group", hideOnMobile: true },
  { key: "customer_subgroup", hideOnMobile: true },
  { key: "customer_segment", hideOnMobile: true },
  { key: "destination_city", hideOnMobile: true },
  { key: "product_family", hideOnMobile: true },
  { key: "order_type", hideOnMobile: true },
  { key: "ordered_quantity", align: "right", format: "number", hideOnMobile: true },
  { key: "invoiced_quantity", align: "right", format: "number", hideOnMobile: true },
  { key: "pending_quantity", align: "right", format: "number" },
  { key: "total_order_value", align: "right", format: "currency" },
]

const OPEN_COLUMNS: ColumnDef<OpenDeliveryRow>[] = [
  { key: "month" },
  { key: "seller_name" },
  { key: "customer_code", hideOnMobile: true },
  { key: "customer_name" },
  { key: "customer_group", hideOnMobile: true },
  { key: "customer_subgroup", hideOnMobile: true },
  { key: "customer_segment", hideOnMobile: true },
  { key: "city", hideOnMobile: true },
  { key: "product_family", hideOnMobile: true },
  { key: "order_type", hideOnMobile: true },
  { key: "delivered_quantity", align: "right", format: "number", hideOnMobile: true },
  { key: "open_delivery_value", align: "right", format: "currency" },
]

/* ----------------------------------------------------------------
 *  Static registry — exposes the icon + label per drilldown id.
 *  Filenames and code-level ids stay in English; the user-facing
 *  label is resolved from the i18n dictionary.
 * ---------------------------------------------------------------- */

const REGISTRY: Record<
  DrilldownId,
  {
    iconName: IconName
    label: () => string
    /** CSV file stem; the table appends `.csv`. */
    filename: string
  }
> = {
  netSales: {
    iconName: "dollar",
    label: () => t.dashboard.cards.netSales,
    filename: "ventas-netas",
  },
  pending: {
    iconName: "shopping-bag",
    label: () => t.dashboard.cards.pending,
    filename: "pedidos-pendientes",
  },
  overdue: {
    iconName: "alert-triangle",
    label: () => t.dashboard.cards.overdue,
    filename: "pedidos-vencidos",
  },
  open: {
    iconName: "truck",
    label: () => t.dashboard.cards.open,
    filename: "entregas-abiertas",
  },
}

/* ----------------------------------------------------------------
 *  Body components — one per drilldown id. Each owns its own fetcher
 *  so we never duplicate query logic and the parent doesn't need to
 *  know view schemas. They all share the same filter key as the rest
 *  of the dashboard so filter changes ripple into the open sheet.
 * ---------------------------------------------------------------- */

function useFilterKey(filters?: DashboardFilters) {
  return React.useMemo(() => JSON.stringify(filters ?? null), [filters])
}

function NetSalesBody({
  filters,
  filename,
}: {
  filters?: DashboardFilters
  filename: string
}) {
  const key = useFilterKey(filters)
  const { data, isLoading, error } = useSupabaseQuery(
    () => fetchSalesRows(filters),
    [key]
  )
  return (
    <DrilldownTable<SalesRow>
      rows={data ?? []}
      columns={SALES_COLUMNS}
      loading={isLoading}
      error={error}
      exportFilename={`${filename}.csv`}
    />
  )
}

function PendingBody({
  filters,
  filename,
}: {
  filters?: DashboardFilters
  filename: string
}) {
  const key = useFilterKey(filters)
  const { data, isLoading, error } = useSupabaseQuery(
    () => fetchPendingOrdersRows(filters),
    [key]
  )
  return (
    <DrilldownTable<PendingOrderRow>
      rows={data ?? []}
      columns={PENDING_COLUMNS}
      loading={isLoading}
      error={error}
      exportFilename={`${filename}.csv`}
    />
  )
}

function OpenBody({
  filters,
  filename,
}: {
  filters?: DashboardFilters
  filename: string
}) {
  const key = useFilterKey(filters)
  const { data, isLoading, error } = useSupabaseQuery(
    () => fetchOpenDeliveriesRows(filters),
    [key]
  )
  return (
    <DrilldownTable<OpenDeliveryRow>
      rows={data ?? []}
      columns={OPEN_COLUMNS}
      loading={isLoading}
      error={error}
      exportFilename={`${filename}.csv`}
    />
  )
}

function OverdueBody({
  filters,
  filename,
}: {
  filters?: DashboardFilters
  filename: string
}) {
  const key = useFilterKey(filters)
  const { data, isLoading, error } = useSupabaseQuery(
    () => fetchOverdueOrdersRows(filters),
    [key]
  )
  const rows = data ?? []
  // Schema is unknown — derive columns from the first row's keys.
  const columns = React.useMemo<ColumnDef<OverdueOrderRow>[]>(
    () => autoColumnsFromRow<OverdueOrderRow>(rows[0]),
    [rows]
  )
  return (
    <DrilldownTable<OverdueOrderRow>
      rows={rows}
      columns={columns}
      loading={isLoading}
      error={error}
      exportFilename={`${filename}.csv`}
    />
  )
}

/* ----------------------------------------------------------------
 *  Public wrapper — pick the right body based on the active id.
 * ---------------------------------------------------------------- */

export type KpiDrilldownProps = {
  activeId: DrilldownId | null
  onClose: () => void
  filters?: DashboardFilters
}

export function KpiDrilldown({ activeId, onClose, filters }: KpiDrilldownProps) {
  // Keep the last id so closing animations don't blank the sheet contents.
  const [lastId, setLastId] = React.useState<DrilldownId | null>(activeId)
  React.useEffect(() => {
    if (activeId) setLastId(activeId)
  }, [activeId])

  const id = lastId
  const meta = id ? REGISTRY[id] : null

  return (
    <KpiDetailSheet
      open={activeId != null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      label={meta?.label() ?? ""}
      iconName={meta?.iconName}
    >
      {id === "netSales" && meta ? (
        <NetSalesBody filters={filters} filename={meta.filename} />
      ) : null}
      {id === "pending" && meta ? (
        <PendingBody filters={filters} filename={meta.filename} />
      ) : null}
      {id === "overdue" && meta ? (
        <OverdueBody filters={filters} filename={meta.filename} />
      ) : null}
      {id === "open" && meta ? (
        <OpenBody filters={filters} filename={meta.filename} />
      ) : null}
    </KpiDetailSheet>
  )
}
