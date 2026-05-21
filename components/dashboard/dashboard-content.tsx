"use client"

import * as React from "react"

import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid"
import { GlobalFilters, type FilterOption } from "@/components/dashboard/global-filters"
import { OperationalHealthPanel } from "@/components/dashboard/operational-health-panel"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { useDashboardFilters } from "@/lib/hooks/use-dashboard-filters"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { t, type FilterKey } from "@/lib/i18n"
import { getSalesFilters } from "@/lib/supabase/sales-fact"

/**
 * Client wrapper that owns the dashboard filter state and threads it through
 * every data-driven section. The server-rendered Dashboard page mounts this
 * wrapper below the SectionHeader, keeping the page itself a Server Component.
 *
 * The same `state` object is passed (controlled) to `GlobalFilters` and the
 * raw `filters` to each data consumer. Filter changes propagate through the
 * `useSupabaseQuery` deps inside each consumer, so the KPI grid, chart, and
 * operational health panel refetch automatically.
 *
 * Filter options are fetched once on mount from `sales_fact` distinct values
 * and merged into `GlobalFilters` — no hardcoded dimension lists.
 */
export function DashboardContent() {
  const state = useDashboardFilters()
  const { filters } = state

  // Fetch distinct filter options from sales_fact once on mount.
  const { data: filterData } = useSupabaseQuery(() => getSalesFilters(), [])

  // Map SalesFilterOptions → Record<FilterKey, FilterOption[]> for GlobalFilters.
  const opts = React.useMemo<Partial<Record<FilterKey, FilterOption[]>>>(() => {
    if (!filterData) return {}
    return {
      year:            filterData.years,
      month:           filterData.months,
      zone:            filterData.zones,
      territory:       filterData.territories,
      seller:          filterData.seniorSellers,
      channel:         filterData.salesTypes,   // "channel" key → sales_type values
      productFamily:   filterData.productFamilies,
      customerGroup:   filterData.customerGroups,
      customerSubgroup: filterData.customerSubgroups,
      customerSegment: filterData.customerSegments,
    }
  }, [filterData])

  return (
    <>
      <GlobalFilters state={state} options={opts} />
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
