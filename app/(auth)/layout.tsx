import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { t } from "@/lib/i18n"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-12">
      {/* Subtle radial glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--firplak-navy)]/5 blur-[120px]" />
      </div>

      {/* Brand mark above the card */}
      <Link
        href="/login"
        className="mb-8 flex flex-col items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t.brand.fullName}
      >
        <span className="relative size-12">
          <Image
            src="/branding/firplak-mark-navy.png"
            alt="FIRPLAK"
            fill
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/branding/firplak-mark-white.png"
            alt="FIRPLAK"
            fill
            className="hidden object-contain dark:block"
            priority
          />
        </span>
        <span className="flex flex-col items-center gap-px leading-none">
          <span className="text-[15px] font-semibold tracking-tight">
            {t.brand.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t.brand.tagline}
          </span>
        </span>
      </Link>

      {children}
    </div>
  )
}
