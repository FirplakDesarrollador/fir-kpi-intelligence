"use client"

import * as React from "react"

import type { FilterKey } from "@/lib/i18n"

/**
 * Canonical dashboard filter state.
 *
 * - One entry per dimension keyed by `FilterKey`.
 * - `null` means "no filter applied" (i.e., the "Todos" option).
 * - Strings are kept opaque on purpose so consumers (Supabase fetchers, URL
 *   serializers, etc.) can decide how to interpret them later.
 */
export type DashboardFilters = Record<FilterKey, string | null>

export const FILTER_KEYS: readonly FilterKey[] = [
  "year",
  "month",
  "channel",
  "zone",
  "territory",
  "seller",
  "productFamily",
  "customerGroup",
  "customerSubgroup",
  "customerSegment",
] as const

export const emptyFilters: DashboardFilters = FILTER_KEYS.reduce(
  (acc, key) => {
    acc[key] = null
    return acc
  },
  {} as DashboardFilters
)

export type UseDashboardFiltersReturn = {
  filters: DashboardFilters
  setFilter: (key: FilterKey, value: string | null) => void
  setMany: (next: Partial<DashboardFilters>) => void
  resetFilters: () => void
  isActive: (key: FilterKey) => boolean
  activeCount: number
}

/**
 * Reusable filter-state hook for the dashboard.
 *
 * Currently in-memory only — no URL/localStorage persistence yet. The shape is
 * intentionally minimal so the same hook can power additional views later
 * (Sales Analysis, Forecasting, etc.). When a real Supabase query layer needs
 * these filters, it should call `useDashboardFilters()` and translate the
 * `filters` object into its query parameters.
 */
export function useDashboardFilters(
  initial?: Partial<DashboardFilters>
): UseDashboardFiltersReturn {
  const [filters, setFilters] = React.useState<DashboardFilters>(() => ({
    ...emptyFilters,
    ...initial,
  }))

  const setFilter = React.useCallback(
    (key: FilterKey, value: string | null) => {
      setFilters((prev) => {
        if (prev[key] === value) return prev
        return { ...prev, [key]: value }
      })
    },
    []
  )

  const setMany = React.useCallback((next: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }))
  }, [])

  const resetFilters = React.useCallback(() => {
    setFilters(emptyFilters)
  }, [])

  const isActive = React.useCallback(
    (key: FilterKey) => filters[key] != null && filters[key] !== "",
    [filters]
  )

  const activeCount = React.useMemo(
    () => FILTER_KEYS.reduce((n, k) => n + (filters[k] ? 1 : 0), 0),
    [filters]
  )

  return { filters, setFilter, setMany, resetFilters, isActive, activeCount }
}
