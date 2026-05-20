import Image from "next/image"
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
        "group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={t.brand.fullName}
    >
      {/*
        Mark container: fixed 36×36px, position:relative required for fill.
        CSS class-based theme switching avoids any mounted-state flash because
        next-themes applies the .dark class to <html> before first paint.
      */}
      <span className="relative h-9 w-9 shrink-0">
        {/* Light mode */}
        <Image
          src="/branding/firplak-mark-navy.png"
          alt="FIRPLAK"
          fill
          className="object-contain dark:hidden"
          priority
        />
        {/* Dark mode */}
        <Image
          src="/branding/firplak-mark-white.png"
          alt="FIRPLAK"
          fill
          className="hidden object-contain dark:block"
          priority
        />
      </span>

      <span className="flex flex-col gap-px leading-none">
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
