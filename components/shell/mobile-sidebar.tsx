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
import { t } from "@/lib/i18n"

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false)

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
        className="glass-strong w-72 border-none p-0 sm:max-w-xs"
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
      </SheetContent>
    </Sheet>
  )
}
