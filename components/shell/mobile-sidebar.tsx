"use client"

import * as React from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Brand } from "@/components/shell/brand"
import { SidebarNav } from "@/components/shell/sidebar-nav"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { t } from "@/lib/i18n"

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

type MobileSidebarProps = {
  nombre: string
  email: string
}

export function MobileSidebar({ nombre, email }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false)
  const initials = getInitials(nombre)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.nav.openNavigation}
            className="lg:hidden rounded-full bg-background/40 ring-1 ring-foreground/10 backdrop-blur-xl supports-backdrop-filter:bg-background/30 hover:bg-background/60"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="glass-strong w-72 border-none p-0 sm:max-w-xs flex flex-col"
      >
        <SheetHeader className="flex flex-row items-center gap-2 px-4 py-3">
          <Brand />
          <SheetTitle className="sr-only">{t.nav.navigationTitle}</SheetTitle>
          <SheetDescription className="sr-only">
            {t.nav.navigationDescription}
          </SheetDescription>
        </SheetHeader>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="scrollbar-thin flex-1 overflow-y-auto py-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
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
            <p className="truncate text-[12px] font-medium leading-tight">{nombre}</p>
            <p className="truncate text-[10px] text-muted-foreground">{email}</p>
          </div>
          <LogoutButton showLabel={false} variant="ghost" className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
