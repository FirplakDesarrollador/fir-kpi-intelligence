"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { navigation } from "@/lib/navigation"
import { t } from "@/lib/i18n"

type SidebarNavProps = {
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={t.nav.ariaPrimary}
      className={cn("flex flex-col gap-6 px-3 py-2", className)}
    >
      {navigation.map((section) => (
        <div key={section.id} className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
            {t.nav.sections[section.id]}
          </div>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/")
              const title = t.nav.items[item.id]

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 -z-0 rounded-xl bg-foreground/[0.06] ring-1 ring-foreground/10 backdrop-blur-md dark:bg-foreground/[0.08]"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "relative z-10 size-4 shrink-0 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="relative z-10 truncate">{title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
