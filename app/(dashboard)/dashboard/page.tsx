import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { SectionHeader } from "@/components/dashboard/section-header"
import { t } from "@/lib/i18n"

export const metadata: Metadata = {
  title: t.pages.dashboard.metaTitle,
}

export default function DashboardPage() {
  const page = t.pages.dashboard
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <SectionHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        actions={
          <>
            <Button variant="outline" size="sm">
              {t.common.last30Days}
            </Button>
            <Button size="sm">{t.common.export}</Button>
          </>
        }
      />

      {/* Filter state, KPI grid, chart, and operational health all live in
          this client wrapper so filter changes ripple through every section. */}
      <DashboardContent />
    </div>
  )
}
