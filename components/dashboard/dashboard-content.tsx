"use client"

import * as React from "react"

import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid"
import { GlobalFilters } from "@/components/dashboard/global-filters"
import { OperationalHealthPanel } from "@/components/dashboard/operational-health-panel"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { useDashboardFilters } from "@/lib/hooks/use-dashboard-filters"
import { t } from "@/lib/i18n"

/**
 * Client wrapper that owns the dashboard filter state and threads it through
 * every data-driven section. The server-rendered Dashboard page mounts this
 * wrapper below the SectionHeader, keeping the page itself a Server Component.
 *
 * The same `state` object is passed (controlled) to `GlobalFilters` and the
 * raw `filters` to each data consumer. Filters changes propagate through the
 * `useSupabaseQuery` deps inside each consumer, so the KPI grid, chart, and
 * operational health panel refetch automatically.
 */
export function DashboardContent() {
  const state = useDashboardFilters()
  const { filters } = state

  return (
    <>
      <GlobalFilters state={state} />
      <DashboardKpiGrid filters={filters} />
      <section
        aria-label={t.dashboard.chartAria}
        className="grid grid-cols-1 gap-3 xl:grid-cols-3"
      >
        <SalesChart className="xl:col-span-2" filters={filters} />
        <OperationalHealthPanel filters={filters} />
      </section>
    </>
  )
}
