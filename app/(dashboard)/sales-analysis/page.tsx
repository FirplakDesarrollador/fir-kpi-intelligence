import type { Metadata } from "next"

import { SectionHeader } from "@/components/dashboard/section-header"
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder"
import { t } from "@/lib/i18n"

const page = t.pages["sales-analysis"]

export const metadata: Metadata = {
  title: page.metaTitle,
}

export default function SalesAnalysisPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <SectionHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
      />
      <ModulePlaceholder
        iconName="bar-chart"
        title={page.placeholder!.title}
        description={page.placeholder!.description}
        bullets={page.placeholder!.bullets}
      />
    </div>
  )
}
