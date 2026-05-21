"use client"

import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/auth/actions"
import { t } from "@/lib/i18n"

type LogoutButtonProps = {
  variant?: "ghost" | "outline"
  showLabel?: boolean
  className?: string
}

/**
 * Logout button — wraps the logoutAction Server Action in a <form>.
 * Using a form ensures the action works even before React hydration.
 */
export function LogoutButton({
  variant = "ghost",
  showLabel = true,
  className,
}: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant={variant}
        size={showLabel ? "sm" : "icon-sm"}
        className={className}
        aria-label={t.auth.logoutButton}
      >
        <LogOut className="size-4" />
        {showLabel && (
          <span className="text-[13px]">{t.auth.logoutButton}</span>
        )}
      </Button>
    </form>
  )
}
