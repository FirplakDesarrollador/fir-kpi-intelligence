"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Briefcase,
  CircleDollarSign,
  Download,
  Gauge,
  LayoutDashboard,
  LineChart,
  Menu,
  Minus,
  Monitor,
  Moon,
  Package,
  Scale,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Sun,
  TrendingUp,
  Truck,
  Wand2,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Central icon registry.
 *
 * All icons are imported and instantiated inside this client module so that
 * Server Components can refer to them by string name. Passing icon function
 * references across the RSC boundary is not allowed — RSC can only serialize
 * plain data (strings, numbers, plain objects, arrays). This registry pattern
 * keeps the lucide module on the client side only.
 */
export const iconRegistry = {
  "alert-triangle": AlertTriangle,
  "arrow-down-right": ArrowDownRight,
  "arrow-up-right": ArrowUpRight,
  "bar-chart": BarChart3,
  "bell": Bell,
  "briefcase": Briefcase,
  "dollar": CircleDollarSign,
  "download": Download,
  "gauge": Gauge,
  "dashboard": LayoutDashboard,
  "line-chart": LineChart,
  "menu": Menu,
  "minus": Minus,
  "monitor": Monitor,
  "moon": Moon,
  "package": Package,
  "scale": Scale,
  "search": Search,
  "settings": SettingsIcon,
  "shopping-bag": ShoppingBag,
  "sun": Sun,
  "trending-up": TrendingUp,
  "truck": Truck,
  "wand": Wand2,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof iconRegistry

export type IconProps = LucideProps & {
  name: IconName
}

/**
 * Render any registered icon by name. Use this everywhere on the client side
 * instead of importing from lucide-react directly when the consumer also needs
 * to support being driven by server data / strings.
 */
export function Icon({ name, className, ...props }: IconProps) {
  const Component = iconRegistry[name]
  if (!Component) return null
  return <Component className={cn(className)} {...props} />
}
