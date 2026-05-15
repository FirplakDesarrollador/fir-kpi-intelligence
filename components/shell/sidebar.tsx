"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { Brand } from "@/components/shell/brand"
import { SidebarNav } from "@/components/shell/sidebar-nav"

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-64 shrink-0 flex-col lg:flex",
        className
      )}
      aria-label={t.nav.navigationTitle}
    >
      <div className="glass m-3 mr-0 flex h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-2xl">
        <div className="flex h-14 items-center px-4">
          <Brand />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="scrollbar-thin flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="flex items-center gap-2.5 px-4 py-3 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" />
          <span>{t.nav.supabaseConnected}</span>
        </div>
      </div>
    </aside>
  )
}
