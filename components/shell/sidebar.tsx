"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { Brand } from "@/components/shell/brand"
import { SidebarNav } from "@/components/shell/sidebar-nav"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

type SidebarProps = {
  className?: string
  nombre: string
  email: string
}

export function Sidebar({ className, nombre, email }: SidebarProps) {
  const initials = getInitials(nombre)

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-64 shrink-0 flex-col lg:flex",
        className
      )}
      aria-label={t.nav.navigationTitle}
    >
      <div className="glass m-3 mr-0 flex h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-2xl">
        {/* Brand */}
        <div className="flex h-14 items-center px-4">
          <Brand />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        {/* Navigation */}
        <div className="scrollbar-thin flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>

        {/* User footer */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="flex items-center gap-2.5 px-3 py-3">
          <Avatar className="size-7 shrink-0 ring-1 ring-foreground/10">
            <AvatarFallback className="bg-gradient-to-br from-[#254153] to-[#749094] text-[10px] font-semibold text-[#f5f1ea]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium leading-tight">
              {nombre}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {email}
            </p>
          </div>
          <LogoutButton
            showLabel={false}
            variant="ghost"
            className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
          />
        </div>
      </div>
    </aside>
  )
}
