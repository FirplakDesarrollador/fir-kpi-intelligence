"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ListFilter, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { t, type FilterKey } from "@/lib/i18n"
import {
  FILTER_KEYS,
  useDashboardFilters,
  type DashboardFilters,
  type UseDashboardFiltersReturn,
} from "@/lib/hooks/use-dashboard-filters"
import type { FilterOption } from "@/lib/supabase/sales-fact"

export type { FilterOption }

/** Sentinel value used inside the Select to represent "no filter applied". */
const ALL_VALUE = "__all__"

/**
 * Default options for the period filters so the bar feels alive on first
 * paint even before Supabase-driven option providers are wired. Dimension
 * filters (zone, seller, etc.) default to empty lists — the Select will show
 * only "Todos" until real options arrive.
 */
function defaultOptions(): Partial<Record<FilterKey, FilterOption[]>> {
  const now = new Date()
  const thisYear = now.getFullYear()
  const years: FilterOption[] = Array.from({ length: 5 }, (_, i) => {
    const y = thisYear - i
    return { value: String(y), label: String(y) }
  })
  const monthNames = [
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
  const months: FilterOption[] = monthNames.map((name, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: name,
  }))
  return { year: years, month: months }
}

export type GlobalFiltersProps = {
  /** Optional controlled hook state — pass the result of useDashboardFilters. */
  state?: UseDashboardFiltersReturn
  /** Optional option lists per filter. Falls back to defaults / empty. */
  options?: Partial<Record<FilterKey, FilterOption[]>>
  className?: string
  /** Fires after the user resets all filters. */
  onReset?: () => void
  /** Fires after any single filter changes (key, value). */
  onChange?: (key: FilterKey, value: string | null) => void
}

/**
 * Enterprise-grade filter bar. Renders ten dimensional Selects in a
 * responsive grid inside the same Liquid Glass treatment as KPI cards.
 *
 * Filters are NOT connected to Supabase queries yet — this component only
 * surfaces the UI and the state. Consumers can pass `state` (recommended) or
 * let the component create its own internal state, then read `state.filters`
 * to build query payloads later.
 */
export function GlobalFilters({
  state,
  options,
  className,
  onReset,
  onChange,
}: GlobalFiltersProps) {
  // Internal-state fallback when no controlled `state` is provided.
  const internal = useDashboardFilters()
  const s = state ?? internal

  const opts = React.useMemo(() => {
    const merged: Partial<Record<FilterKey, FilterOption[]>> = {
      ...defaultOptions(),
      ...(options ?? {}),
    }
    return merged
  }, [options])

  const handleChange = React.useCallback(
    (key: FilterKey, value: string | null) => {
      const next = value === ALL_VALUE || value == null ? null : value
      s.setFilter(key, next)
      onChange?.(key, next)
    },
    [onChange, s]
  )

  const handleReset = React.useCallback(() => {
    s.resetFilters()
    onReset?.()
  }, [onReset, s])

  const activeLabel =
    s.activeCount === 0
      ? null
      : s.activeCount === 1
        ? t.filters.active.one
        : t.filters.active.many.replace("{n}", String(s.activeCount))

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t.filters.title}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-foreground/[0.04] ring-1 ring-foreground/10 backdrop-blur-md">
            <ListFilter className="size-4 text-muted-foreground" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-tight">
              {t.filters.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t.filters.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-foreground/10">
              <span className="size-1.5 rounded-full bg-[#254153] dark:bg-[#749094]" />
              {activeLabel}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={s.activeCount === 0}
            aria-label={t.filters.reset}
            className="gap-1.5"
          >
            <X className="size-3.5" />
            {t.filters.reset}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {FILTER_KEYS.map((key) => (
          <FilterControl
            key={key}
            filterKey={key}
            value={s.filters[key]}
            options={opts[key] ?? []}
            onValueChange={(v) => handleChange(key, v)}
          />
        ))}
      </div>
    </motion.section>
  )
}

/* ---------- single Select control ---------- */

type FilterControlProps = {
  filterKey: FilterKey
  value: DashboardFilters[FilterKey]
  options: FilterOption[]
  onValueChange: (value: string | null) => void
}

function FilterControl({
  filterKey,
  value,
  options,
  onValueChange,
}: FilterControlProps) {
  const label = t.filters.labels[filterKey]
  const selectValue = value ?? ALL_VALUE

  return (
    <div className="flex flex-col gap-1">
      <span className="px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <Select value={selectValue} onValueChange={onValueChange}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "h-9 w-full justify-between rounded-xl border-foreground/10 bg-background/40 text-[13px] font-medium backdrop-blur-xl transition-colors hover:bg-background/60 data-[size=default]:h-9",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <SelectValue placeholder={t.filters.all} />
        </SelectTrigger>
        <SelectContent className="glass-strong rounded-xl">
          <SelectItem value={ALL_VALUE}>
            <span className="text-muted-foreground">{t.filters.all}</span>
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
