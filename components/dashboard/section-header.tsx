import * as React from "react"
import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: string
  className?: string
}

export function SectionHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
