"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

/**
 * App-wide theme provider. Wraps `next-themes` and bakes in the workspace
 * defaults (class strategy, system preference enabled, no transitions while
 * switching). Consumers should mount this once inside the root layout so its
 * inline hydration script runs as early as possible.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="firplak-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
