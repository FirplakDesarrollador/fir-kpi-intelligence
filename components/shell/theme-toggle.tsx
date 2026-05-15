"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { t } from "@/lib/i18n"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.topbar.themeToggle}
            className="relative rounded-full bg-background/40 ring-1 ring-foreground/10 backdrop-blur-xl supports-backdrop-filter:bg-background/30 hover:bg-background/60"
          />
        }
      >
        {mounted ? (
          <>
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </>
        ) : (
          <Sun className="size-4" />
        )}
        <span className="sr-only">{t.topbar.themeToggle}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-selected={theme === "light"}
        >
          <Sun className="size-4" />
          {t.theme.light}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-selected={theme === "dark"}
        >
          <Moon className="size-4" />
          {t.theme.dark}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-selected={theme === "system"}
        >
          <Monitor className="size-4" />
          {t.theme.system}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
