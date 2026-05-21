import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import { t } from "@/lib/i18n"

export const metadata: Metadata = {
  title: t.auth.loginTitle,
}

export default function LoginPage() {
  return (
    <div className="glass w-full max-w-sm rounded-2xl p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {t.auth.loginTitle}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {t.auth.loginSubtitle}
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
