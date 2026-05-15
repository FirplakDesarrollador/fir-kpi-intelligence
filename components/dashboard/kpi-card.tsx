"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icons"
import { t } from "@/lib/i18n"

export type KpiTrend = "up" | "down" | "flat"

export type KpiCardProps = {
  label: string
  value: string
  delta?: string
  trend?: KpiTrend
  hint?: string
  iconName?: IconName
  accent?: "blue" | "violet" | "teal" | "amber" | "rose" | "emerald"
  index?: number
  className?: string
  /** Render a skeleton in-place of the live values. */
  loading?: boolean
  /** Optional error to indicate a live data failure (UI is otherwise preserved). */
  error?: Error | null
  /**
   * When provided, the card becomes interactive (focus ring, keyboard
   * activation, hover lift) and the callback is invoked on click / Enter /
   * Space. Cards without onClick render as plain panels.
   */
  onClick?: () => void
  /** ARIA label override for clickable cards (defaults to `label`). */
  clickableLabel?: string
}

/**
 * Accent halos for KPI cards, harmonized to the FIRPLAK palette. The keys are
 * preserved for backwards compatibility with existing call sites; the colors
 * have been retuned around Primary Navy + Secondary Blue Gray with restrained
 * warm and cool inflections so all six cards feel like one brand family.
 */
const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "from-[#254153]/35 to-transparent",
  violet: "from-[#3c5d72]/35 to-transparent",
  teal: "from-[#749094]/40 to-transparent",
  amber: "from-[oklch(0.78_0.10_70)]/35 to-transparent",
  rose: "from-[oklch(0.62_0.16_25)]/35 to-transparent",
  emerald: "from-[oklch(0.60_0.10_165)]/35 to-transparent",
}

const trendStyles: Record<KpiTrend, string> = {
  up: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  down: "text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/20",
  flat: "text-muted-foreground bg-foreground/5 ring-foreground/10",
}

const trendIconMap: Record<KpiTrend, IconName> = {
  up: "arrow-up-right",
  down: "arrow-down-right",
  flat: "minus",
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded-md bg-foreground/10",
        className
      )}
    />
  )
}

export function KpiCard({
  label,
  value,
  delta,
  trend = "flat",
  hint,
  iconName,
  accent = "blue",
  index = 0,
  className,
  loading = false,
  error = null,
  onClick,
  clickableLabel,
}: KpiCardProps) {
  const interactive = typeof onClick === "function"

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick?.()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? (clickableLabel ?? label) : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={cn(
        "glass group relative overflow-hidden rounded-2xl p-4",
        interactive &&
          "cursor-pointer outline-none transition-shadow hover:ring-1 hover:ring-foreground/15 focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-busy={loading || undefined}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-80 transition-opacity group-hover:opacity-100",
          accentMap[accent]
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </span>
          {loading ? (
            <ShimmerBar className="mt-1 h-7 w-24" />
          ) : (
            <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </span>
          )}
        </div>
        {iconName ? (
          <span className="flex size-9 items-center justify-center rounded-xl bg-foreground/[0.04] text-muted-foreground ring-1 ring-foreground/10 backdrop-blur-md">
            <Icon name={iconName} className="size-4" />
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {loading ? (
          <ShimmerBar className="h-5 w-20" />
        ) : delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
              trendStyles[trend]
            )}
          >
            <Icon name={trendIconMap[trend]} className="size-3" />
            {delta}
          </span>
        ) : null}
        {loading ? null : hint ? (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
        {error && !loading ? (
          <span
            title={error.message}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400"
          >
            <Icon name="alert-triangle" className="size-3" />
            {t.common.fallback}
          </span>
        ) : null}
      </div>
    </motion.div>
  )
}
