"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icons"
import { t } from "@/lib/i18n"

type ModulePlaceholderProps = {
  iconName: IconName
  title: string
  description: string
  bullets?: string[]
  className?: string
}

export function ModulePlaceholder({
  iconName,
  title,
  description,
  bullets,
  className,
}: ModulePlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-10 text-center",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-20 h-48 bg-gradient-to-b from-[#254153]/28 via-[#749094]/18 to-transparent blur-2xl"
      />
      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/10 backdrop-blur-md">
        <Icon name={iconName} className="size-6 text-foreground/80" />
      </span>
      <div className="relative flex max-w-xl flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {bullets && bullets.length > 0 ? (
        <ul className="relative mt-2 grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-xl bg-foreground/[0.03] px-3 py-2 text-left text-[13px] text-muted-foreground ring-1 ring-foreground/5"
            >
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground/40" />
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="relative mt-2 inline-flex items-center gap-2 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/10">
        <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_6px] shadow-amber-500/60" />
        {t.placeholder.status}
      </span>
    </motion.div>
  )
}
