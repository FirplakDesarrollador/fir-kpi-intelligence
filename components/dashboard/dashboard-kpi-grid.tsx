"use client"

import * as React from "react"

import { KpiCard, type KpiTrend } from "@/components/dashboard/kpi-card"
import { KpiDrilldown } from "@/components/dashboard/kpi-drilldown"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import {
  fetchBlockedOrders,
  fetchDeliveriesPendingPod,
  fetchOpenDeliveries,
  fetchOverdueOrders,
  fetchPendingOrders,
  fetchSalesMonthly,
} from "@/lib/queries"
import { t, type DrilldownId } from "@/lib/i18n"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"

/* ----------------------- formatters ------------------------ */

function compactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${Math.round(value).toLocaleString()}`
}

function pct(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return `${Math.round(value)}%`
}

function trendFromDelta(delta: number, betterIsUp = true): KpiTrend {
  if (Math.abs(delta) < 1e-6) return "flat"
  const isUp = delta > 0
  return (isUp === betterIsUp ? "up" : "down") as KpiTrend
}

/* ----------------------- card model ----------------------- */

type CardModel = {
  label: string
  value: string
  delta?: string
  trend?: KpiTrend
  hint?: string
}

/* ----------------------- grid ------------------------------ */

export type DashboardKpiGridProps = {
  filters?: DashboardFilters
}

export function DashboardKpiGrid({ filters }: DashboardKpiGridProps) {
  // Stable cache key for filter-driven refetching. Serializing once per
  // filter change keeps the dependency lists short and predictable.
  const filterKey = React.useMemo(
    () => JSON.stringify(filters ?? null),
    [filters]
  )

  const sales = useSupabaseQuery(() => fetchSalesMonthly(filters), [filterKey])
  const pending = useSupabaseQuery(
    () => fetchPendingOrders(filters),
    [filterKey]
  )
  const overdue = useSupabaseQuery(
    () => fetchOverdueOrders(filters),
    [filterKey]
  )
  const openDel = useSupabaseQuery(
    () => fetchOpenDeliveries(filters),
    [filterKey]
  )
  const pod = useSupabaseQuery(
    () => fetchDeliveriesPendingPod(filters),
    [filterKey]
  )
  // Warm the blocked-orders query (surfaced in the operational health panel).
  useSupabaseQuery(() => fetchBlockedOrders(filters), [filterKey])

  /* Net sales (MTD) + attainment derived from sales_kpi_monthly */
  const netSalesModel: CardModel = React.useMemo(() => {
    const rows = sales.data ?? []
    if (rows.length === 0) {
      return { label: t.dashboard.cards.netSales, value: "—", trend: "flat", hint: t.common.vsBudget }
    }
    const last = rows[rows.length - 1]
    const prev = rows.length > 1 ? rows[rows.length - 2] : undefined
    const value = compactCurrency(last.sales)
    const hint = t.common.vsBudget
    if (!prev || prev.sales === 0) {
      return {
        label: t.dashboard.cards.netSales,
        value,
        delta: undefined,
        trend: "flat",
        hint,
      }
    }
    const deltaPct = ((last.sales - prev.sales) / prev.sales) * 100
    return {
      label: t.dashboard.cards.netSales,
      value,
      delta: `${deltaPct >= 0 ? "+" : "−"}${Math.abs(deltaPct).toFixed(1)}%`,
      trend: trendFromDelta(deltaPct, true),
      hint,
    }
  }, [sales.data])

  const attainmentModel: CardModel = React.useMemo(() => {
    const rows = sales.data ?? []
    if (rows.length === 0) {
      return { label: t.dashboard.cards.attainment, value: "—", trend: "flat", hint: t.common.currentMonth }
    }
    const last = rows[rows.length - 1]
    const prev = rows.length > 1 ? rows[rows.length - 2] : undefined
    if (last.budget <= 0) {
      return { label: t.dashboard.cards.attainment, value: "—", trend: "flat", hint: t.common.currentMonth }
    }
    const lastPct = (last.sales / last.budget) * 100
    if (!prev || prev.budget <= 0) {
      return {
        label: t.dashboard.cards.attainment,
        value: pct(lastPct),
        hint: t.common.currentMonth,
        trend: lastPct >= 100 ? "up" : "down",
      }
    }
    const prevPct = (prev.sales / prev.budget) * 100
    const ptsDelta = lastPct - prevPct
    return {
      label: t.dashboard.cards.attainment,
      value: pct(lastPct),
      delta: `${ptsDelta >= 0 ? "+" : "−"}${Math.abs(ptsDelta).toFixed(1)} pts`,
      trend: trendFromDelta(ptsDelta, true),
      hint: t.common.vsLastMonth,
    }
  }, [sales.data])

  const pendingModel: CardModel = React.useMemo(() => {
    if (pending.data == null) {
      return { label: t.dashboard.cards.pending, value: "—" }
    }
    return {
      label: t.dashboard.cards.pending,
      value: pending.data.toLocaleString(),
      hint: t.common.live,
    }
  }, [pending.data])

  const overdueModel: CardModel = React.useMemo(() => {
    if (overdue.data == null) {
      return { label: t.dashboard.cards.overdue, value: "—" }
    }
    return {
      label: t.dashboard.cards.overdue,
      value: overdue.data.toLocaleString(),
      trend: overdue.data > 0 ? "down" : "up",
      hint: overdue.data > 0 ? t.common.needsReview : t.common.clearStatus,
    }
  }, [overdue.data])

  const openModel: CardModel = React.useMemo(() => {
    if (openDel.data == null) {
      return { label: t.dashboard.cards.open, value: "—" }
    }
    return {
      label: t.dashboard.cards.open,
      value: openDel.data.toLocaleString(),
      hint: t.common.inTransit,
    }
  }, [openDel.data])

  const podModel: CardModel = React.useMemo(() => {
    if (pod.data == null) {
      return { label: t.dashboard.cards.pod, value: "—" }
    }
    return {
      label: t.dashboard.cards.pod,
      value: pod.data.toLocaleString(),
      trend: pod.data > 0 ? "down" : "up",
      hint: pod.data > 0 ? t.common.followUp : t.common.allSigned,
    }
  }, [pod.data])

  /* Drilldown state — only the four KPIs with confirmed schemas are clickable. */
  const [activeDrilldown, setActiveDrilldown] =
    React.useState<DrilldownId | null>(null)

  return (
    <>
      <section
        aria-label={t.dashboard.kpiAria}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <KpiCard
          index={0}
          {...netSalesModel}
          iconName="dollar"
          accent="blue"
          loading={sales.isLoading}
          error={sales.error}
          onClick={() => setActiveDrilldown("netSales")}
        />
        <KpiCard
          index={1}
          {...attainmentModel}
          iconName="trending-up"
          accent="violet"
          loading={sales.isLoading}
          error={sales.error}
        />
        <KpiCard
          index={2}
          {...pendingModel}
          iconName="shopping-bag"
          accent="teal"
          loading={pending.isLoading}
          error={pending.error}
          onClick={() => setActiveDrilldown("pending")}
        />
        <KpiCard
          index={3}
          {...overdueModel}
          iconName="alert-triangle"
          accent="rose"
          loading={overdue.isLoading}
          error={overdue.error}
          onClick={() => setActiveDrilldown("overdue")}
        />
        <KpiCard
          index={4}
          {...openModel}
          iconName="truck"
          accent="amber"
          loading={openDel.isLoading}
          error={openDel.error}
          onClick={() => setActiveDrilldown("open")}
        />
        <KpiCard
          index={5}
          {...podModel}
          iconName="package"
          accent="emerald"
          loading={pod.isLoading}
          error={pod.error}
        />
      </section>

      <KpiDrilldown
        activeId={activeDrilldown}
        onClose={() => setActiveDrilldown(null)}
        filters={filters}
      />
    </>
  )
}
