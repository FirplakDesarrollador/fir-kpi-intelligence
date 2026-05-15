"use client"

import * as React from "react"

export type QueryState<T> = {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Tiny client-side query hook with loading + error + refetch.
 *
 * Intentionally dependency-free (no react-query) — the dashboard's reads are
 * read-only KPI views, refresh-on-mount is plenty, and we keep the bundle
 * lean. `deps` controls when the query reruns.
 */
export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): QueryState<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setLoading] = React.useState(true)
  const [tick, setTick] = React.useState(0)

  // Stable reference so consumers can put refetch in dependency arrays safely.
  const refetch = React.useCallback(() => {
    setTick((n) => n + 1)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, isLoading, error, refetch }
}
