"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import {
  fetchBlockedOrders,
  fetchDeliveriesPendingPod,
  fetchDeliveriesWithIssues,
} from "@/lib/queries"
import { t } from "@/lib/i18n"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"

type RowModel = {
  label: string
  value: string
  loading?: boolean
  error?: Error | null
  fallback?: boolean
}

function formatCount(n: number | null | undefined, mock: number): {
  value: string
  fallback: boolean
} {
  if (n == null) return { value: mock.toLocaleString(), fallback: true }
  return { value: n.toLocaleString(), fallback: false }
}

function Row({ label, value, loading, error, fallback }: RowModel) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-foreground/[0.04] px-3 py-2 ring-1 ring-foreground/5">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {loading ? (
          <span
            aria-hidden
            className="block h-4 w-10 animate-pulse rounded bg-foreground/10"
          />
        ) : (
          <span
            className={cn(
              "font-medium tabular-nums",
              error ? "text-muted-foreground" : ""
            )}
          >
            {value}
          </span>
        )}
        {fallback && !loading ? (
          <span
            title={error?.message ?? t.health.mockTooltip}
            className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400"
          >
            {t.health.mock}
          </span>
        ) : null}
      </span>
    </li>
  )
}

export type OperationalHealthPanelProps = {
  filters?: DashboardFilters
}

export function OperationalHealthPanel({
  filters,
}: OperationalHealthPanelProps) {
  // The three views currently surfaced here have no confirmed schema, so the
  // query layer intentionally drops the filters before issuing the request.
  // We still pass `filters` so this component refetches when the user toggles
  // anything — the moment the schemas are confirmed in queries.ts the panel
  // becomes filter-aware with no further changes here.
  const filterKey = React.useMemo(
    () => JSON.stringify(filters ?? null),
    [filters]
  )

  const blocked = useSupabaseQuery(
    () => fetchBlockedOrders(filters),
    [filterKey]
  )
  const issues = useSupabaseQuery(
    () => fetchDeliveriesWithIssues(filters),
    [filterKey]
  )
  const pod = useSupabaseQuery(
    () => fetchDeliveriesPendingPod(filters),
    [filterKey]
  )

  const blockedFmt = formatCount(blocked.data, 12)
  const issuesFmt = formatCount(issues.data, 9)
  const podFmt = formatCount(pod.data, 47)

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t.health.eyebrow}
      </div>
      <h3 className="font-heading mt-1 text-lg font-semibold tracking-tight">
        {t.health.title}
      </h3>
      <ul className="mt-5 flex flex-col gap-3 text-sm">
        <Row
          label={t.health.blocked}
          value={blockedFmt.value}
          loading={blocked.isLoading}
          error={blocked.error}
          fallback={blockedFmt.fallback}
        />
        <Row
          label={t.health.deliveriesIssues}
          value={issuesFmt.value}
          loading={issues.isLoading}
          error={issues.error}
          fallback={issuesFmt.fallback}
        />
        <Row
          label={t.health.podPending}
          value={podFmt.value}
          loading={pod.isLoading}
          error={pod.error}
          fallback={podFmt.fallback}
        />
        {/* Avg lead time not surfaced by the available views — kept as a
            static reference until a dedicated KPI view is added. */}
        <Row label={t.health.avgLeadTime} value="4.2d" />
      </ul>
      <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {t.health.updatesEvery}
      </div>
    </div>
  )
}
