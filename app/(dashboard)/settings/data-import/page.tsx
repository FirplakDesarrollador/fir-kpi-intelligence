import type { Metadata } from "next"

import { SectionHeader } from "@/components/dashboard/section-header"
import { ImportWizard } from "@/components/data-import/import-wizard"
import { t } from "@/lib/i18n"

export const metadata: Metadata = {
  title: t.pages["data-import"].metaTitle,
}

export default function DataImportPage() {
  const page = t.pages["data-import"]

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
      />
      <ImportWizard />
    </div>
  )
}
