import * as React from "react"

import { verifySession } from "@/lib/auth/dal"
import { Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifies the session cookie. Redirects to /login if absent or expired.
  // The session payload (nombre, email, rol) is passed to shell components
  // so they don't need their own DB calls.
  const session = await verifySession()

  return (
    <div className="relative flex min-h-svh w-full">
      <Sidebar nombre={session.nombre} email={session.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar nombre={session.nombre} email={session.email} />
        <main
          id="main-content"
          className="relative flex-1 px-3 pb-6 pt-4 lg:pr-3"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
