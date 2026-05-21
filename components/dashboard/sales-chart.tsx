"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/icons"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { fetchSalesMonthly, type SalesMonth } from "@/lib/queries"
import { t } from "@/lib/i18n"
import type { DashboardFilters } from "@/lib/hooks/use-dashboard-filters"


function formatAxis(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatTooltip(value: number) {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${Math.round(value).toLocaleString()}`
}

/** Display label for a YYYY-MM or free-form month string. */
const ES_SHORT_MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]
const EN_SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function shortLabel(month: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(month)
  if (m) {
    const idx = Math.max(0, Math.min(11, Number(m[2]) - 1))
    return ES_SHORT_MONTHS[idx]
  }
  // Translate plain English month names too (mock data).
  const enIdx = EN_SHORT_MONTHS.findIndex(
    (n) => n.toLowerCase() === month.slice(0, 3).toLowerCase()
  )
  if (enIdx !== -1) return ES_SHORT_MONTHS[enIdx]
  return month
}

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {typeof label === "string" ? shortLabel(label) : label}
      </div>
      <div className="flex flex-col gap-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatTooltip(Number(p.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="relative mt-5 h-[300px] w-full overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="flex-1 animate-pulse rounded-md bg-foreground/10"
            style={{
              height: `${30 + (Math.sin(i) + 1) * 28}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export type SalesChartProps = {
  className?: string
  filters?: DashboardFilters
}

export function SalesChart({ className, filters }: SalesChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const filterKey = React.useMemo(
    () => JSON.stringify(filters ?? null),
    [filters]
  )
  const { data, isLoading, error } = useSupabaseQuery(
    () => fetchSalesMonthly(filters),
    [filterKey]
  )
  const liveRows = data ?? []
  const isEmpty = !isLoading && !error && liveRows.length === 0

  const displayRows = React.useMemo(
    () => liveRows.map((r) => ({ ...r, label: shortLabel(r.month) })),
    [liveRows]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-4 sm:p-6",
        className
      )}
      aria-busy={isLoading || undefined}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t.chart.eyebrow}
          </div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t.chart.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--chart-1)]" />
            {t.chart.sales}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--chart-2)]" />
            {t.chart.budget}
          </span>
          {(isEmpty || error) && !isLoading ? (
            <span
              title={error?.message ?? t.chart.fallbackTooltip}
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400"
            >
              <Icon name="alert-triangle" className="size-3" />
              {error ? t.common.fallback : "sin datos"}
            </span>
          ) : null}
        </div>
      </div>

      {!mounted || isLoading ? (
        <ChartSkeleton />
      ) : isEmpty ? (
        <div className="mt-5 flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Sin datos de ventas para el período seleccionado.
        </div>
      ) : (
        <div className="mt-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayRows}
              margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="fillBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.32}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 6"
                stroke="currentColor"
                className="text-foreground/10"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="currentColor"
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={formatAxis}
                width={56}
              />
              <Tooltip
                content={<GlassTooltip />}
                cursor={{
                  stroke: "currentColor",
                  strokeOpacity: 0.15,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="budget"
                name={t.chart.budget}
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#fillBudget)"
              />
              <Area
                type="monotone"
                dataKey="sales"
                name={t.chart.sales}
                stroke="var(--chart-1)"
                strokeWidth={2.25}
                fill="url(#fillSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
