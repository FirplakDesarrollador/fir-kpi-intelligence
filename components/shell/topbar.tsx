"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { MobileSidebar } from "@/components/shell/mobile-sidebar"
import { flatNavigation } from "@/lib/navigation"
import { t } from "@/lib/i18n"

function useCurrentModuleTitle() {
  const pathname = usePathname()
  return React.useMemo(() => {
    const match = flatNavigation.find(
      (n) => pathname === n.href || pathname?.startsWith(n.href + "/")
    )
    return t.nav.items[match?.id ?? "dashboard"]
  }, [pathname])
}

export function Topbar() {
  const title = useCurrentModuleTitle()

  return (
    <header className="sticky top-0 z-30 w-full">
      <div className="px-3 pt-3 lg:px-3 lg:pt-3">
        <div className="glass flex h-14 items-center gap-2 rounded-2xl px-3">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <div className="hidden flex-col leading-tight md:flex">
              <span className="text-[11px] text-muted-foreground">
                {t.brand.fullName}
              </span>
              <span className="text-[13px] font-semibold tracking-tight">
                {title}
              </span>
            </div>
          </div>

          <div className="mx-2 hidden h-6 w-px bg-foreground/10 md:block" />

          <div className="relative ml-1 flex-1 max-w-md hidden md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder={t.topbar.searchPlaceholder}
              aria-label={t.topbar.searchAriaLabel}
              className="h-9 w-full rounded-xl border border-foreground/10 bg-background/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground outline-none backdrop-blur-xl transition-colors hover:bg-background/60 focus:border-foreground/20 focus:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.topbar.notifications}
              className="relative rounded-full bg-background/40 ring-1 ring-foreground/10 backdrop-blur-xl supports-backdrop-filter:bg-background/30 hover:bg-background/60"
            >
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[oklch(0.72_0.16_60)] shadow-[0_0_8px] shadow-[oklch(0.72_0.16_60)]/60" />
            </Button>
            <ThemeToggle />
            <div className="mx-1 hidden h-6 w-px bg-foreground/10 md:block" />
            <Avatar className="size-8 ring-1 ring-foreground/10">
              <AvatarFallback className="bg-gradient-to-br from-[#254153] to-[#749094] text-[11px] font-semibold text-[#f5f1ea]">
                LE
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
