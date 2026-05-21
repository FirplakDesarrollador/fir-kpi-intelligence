"use client"

import * as React from "react"
import { useActionState } from "react"
import { Loader2, LogIn, AlertCircle, Bug } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginAction } from "@/lib/auth/actions"
import type { AuthDebugInfo } from "@/lib/auth/actions"
import { t } from "@/lib/i18n"

// Only render debug UI in development. The env var is inlined at build time
// by Next.js so this component tree is completely excluded from production bundles.
const IS_DEV = process.env.NODE_ENV === "development"

// ---------------------------------------------------------------------------
// Debug panel — development only
// ---------------------------------------------------------------------------

function DebugPanel({ info }: { info: AuthDebugInfo }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "auth.user.id",    value: info.authUserId },
    { label: "auth.user.email", value: info.authEmail },
    { label: "table",           value: info.table },
    {
      label: "row found",
      value: (
        <span className={info.rowFound ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
          {info.rowFound ? "sí" : "no"}
        </span>
      ),
    },
    {
      label: "activo",
      value:
        info.activo === null ? (
          <span className="text-muted-foreground">null / no aplica</span>
        ) : (
          <span className={info.activo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
            {String(info.activo)}
          </span>
        ),
    },
    {
      label: "query error",
      value: info.queryError ? (
        <span className="text-red-600 dark:text-red-400">{info.queryError}</span>
      ) : (
        <span className="text-muted-foreground">ninguno</span>
      ),
    },
  ]

  return (
    <div className="mt-1 rounded-xl border border-amber-500/30 bg-amber-500/6 p-4 text-[11px]">
      <div className="mb-2.5 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        <Bug className="size-3.5" />
        Debug — solo en desarrollo
      </div>

      <dl className="flex flex-col gap-1.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-x-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-all font-mono">{value}</dd>
          </div>
        ))}
      </dl>

      {info.row && (
        <details className="mt-3">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            fila completa (JSON)
          </summary>
          <pre className="mt-1.5 overflow-x-auto rounded-lg bg-foreground/5 p-2 text-[10px] leading-relaxed">
            {JSON.stringify(info.row, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-[13px] font-medium text-foreground"
        >
          {t.auth.emailLabel}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          required
          disabled={pending}
          className="h-10"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-[13px] font-medium text-foreground"
        >
          {t.auth.passwordLabel}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t.auth.passwordPlaceholder}
          required
          disabled={pending}
          className="h-10"
        />
      </div>

      {/* Error message */}
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Dev debug panel — stripped from production build */}
      {IS_DEV && state?.debug && <DebugPanel info={state.debug} />}

      {/* Submit */}
      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-10 gap-2 text-[13px] font-semibold"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.auth.loggingIn}
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            {t.auth.loginButton}
          </>
        )}
      </Button>
    </form>
  )
}
