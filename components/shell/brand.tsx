import Link from "next/link"

import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

export function Brand({
  className,
  href = "/dashboard",
}: {
  className?: string
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg",
        className
      )}
      aria-label={t.brand.fullName}
    >
      <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#254153] via-[#3c5d72] to-[#749094] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_16px_-6px_rgba(29,29,27,0.45)]">
        <span className="text-[13px] font-semibold tracking-tight text-[#f5f1ea]">
          FK
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold tracking-tight">
          {t.brand.name}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t.brand.tagline}
        </span>
      </span>
    </Link>
  )
}
