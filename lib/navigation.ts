import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Scale,
  LineChart,
  Gauge,
  Briefcase,
  BarChart3,
  Download,
  Wand2,
  Settings,
} from "lucide-react"

import type { NavItemId, NavSectionId } from "@/lib/i18n"

/**
 * Pure navigation metadata: route href, icon, and a stable id used to look up
 * user-facing strings in `lib/i18n.ts`. Section labels and item titles do NOT
 * live here — they are localized.
 */
export type NavItem = {
  id: NavItemId
  href: string
  icon: LucideIcon
}

export type NavSection = {
  id: NavSectionId
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    id: "overview",
    items: [{ id: "dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "performance",
    items: [
      { id: "sales-vs-budget", href: "/sales-vs-budget", icon: Scale },
      { id: "forecasting", href: "/forecasting", icon: LineChart },
      { id: "metrics", href: "/metrics", icon: Gauge },
      { id: "sales-analysis", href: "/sales-analysis", icon: BarChart3 },
    ],
  },
  {
    id: "operations",
    items: [
      { id: "management", href: "/management", icon: Briefcase },
      { id: "downloads", href: "/downloads", icon: Download },
    ],
  },
  {
    id: "tools",
    items: [
      { id: "kpi-builder", href: "/kpi-builder", icon: Wand2 },
      { id: "settings", href: "/settings", icon: Settings },
    ],
  },
]

export const flatNavigation: NavItem[] = navigation.flatMap((s) => s.items)
