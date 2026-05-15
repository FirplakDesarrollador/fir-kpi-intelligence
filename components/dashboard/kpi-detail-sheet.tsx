"use client"

import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Icon, type IconName } from "@/components/icons"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

export type KpiDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Plain KPI label, e.g. "Ventas Netas". Used inside the title template. */
  label: string
  iconName?: IconName
  /** Optional override; defaults to the localized subtitle. */
  subtitle?: string
  children: React.ReactNode
  className?: string
}

/**
 * Slide-over panel hosting a KPI drilldown. Reuses the existing shadcn Sheet
 * (base-ui Dialog under the hood) so animations, focus management and
 * keyboard interactions match the rest of the app. The width is widened from
 * the default Sheet size to accommodate tabular data.
 */
export function KpiDetailSheet({
  open,
  onOpenChange,
  label,
  iconName,
  subtitle,
  children,
  className,
}: KpiDetailSheetProps) {
  const title = t.drilldown.titleTemplate.replace("{label}", label)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "glass-strong flex w-full flex-col border-l-foreground/10 p-0 sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl",
          className
        )}
      >
        <SheetHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
          {iconName ? (
            <span className="flex size-10 items-center justify-center rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/10 backdrop-blur-md">
              <Icon name={iconName} className="size-5 text-foreground/80" />
            </span>
          ) : null}
          <div className="flex flex-col leading-tight">
            <SheetTitle className="font-heading text-base font-semibold tracking-tight">
              {title}
            </SheetTitle>
            <SheetDescription className="text-[12px] text-muted-foreground">
              {subtitle ?? t.drilldown.subtitle}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        <div className="scrollbar-thin flex-1 overflow-auto px-5 py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
