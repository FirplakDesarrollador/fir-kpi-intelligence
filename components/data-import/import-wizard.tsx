"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TABLE_SCHEMAS } from "@/lib/data-import/schema-definitions"
import { downloadTemplate } from "@/lib/data-import/template-generator"
import { parseFile } from "@/lib/data-import/file-parser"
import { validateRows } from "@/lib/data-import/data-validator"
import { importRows } from "@/lib/data-import/supabase-importer"
import type { TableSchema } from "@/lib/data-import/schema-definitions"
import type { ParseResult } from "@/lib/data-import/file-parser"
import type { ValidationResult } from "@/lib/data-import/data-validator"
import type { ImportResult, ImportProgress } from "@/lib/data-import/supabase-importer"

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Tabla",      title: "¿Qué tabla quieres cargar?" },
  { id: 2, label: "Plantilla",  title: "Descarga la plantilla" },
  { id: 3, label: "Archivo",    title: "Sube tu archivo" },
  { id: 4, label: "Validar",    title: "Validación de datos" },
  { id: 5, label: "Confirmar",  title: "Confirma la carga" },
  { id: 6, label: "Resultado",  title: "Resultado" },
] as const

type StepId = (typeof STEPS)[number]["id"]

// ── Wizard state ──────────────────────────────────────────────────────────────

type WizardState = {
  step: StepId
  schema: TableSchema | null
  file: File | null
  parseResult: ParseResult | null
  validationResult: ValidationResult | null
  importResult: ImportResult | null
  progress: ImportProgress | null
  isLoading: boolean
}

const initial: WizardState = {
  step: 1,
  schema: null,
  file: null,
  parseResult: null,
  validationResult: null,
  importResult: null,
  progress: null,
  isLoading: false,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportWizard() {
  const [state, setState] = React.useState<WizardState>(initial)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Helpers
  const go = (step: StepId) => setState((s) => ({ ...s, step }))
  const setLoading = (isLoading: boolean) => setState((s) => ({ ...s, isLoading }))
  const reset = () => setState(initial)

  // ── Step 1 — table selection ────────────────────────────────────────────────
  function selectSchema(schema: TableSchema) {
    setState((s) => ({
      ...s,
      schema,
      file: null,
      parseResult: null,
      validationResult: null,
      importResult: null,
      step: 2,
    }))
  }

  // ── Step 2 — download template ──────────────────────────────────────────────
  function handleDownloadTemplate() {
    if (state.schema) downloadTemplate(state.schema)
  }

  // ── Step 3 — file upload ────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !state.schema) return

    setState((s) => ({ ...s, file, isLoading: true }))

    const parseResult = await parseFile(file, state.schema)

    setState((s) => ({
      ...s,
      parseResult,
      isLoading: false,
      step: parseResult.ok ? 4 : 3,
    }))
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    // Simulate file input change
    const dt = new DataTransfer()
    dt.items.add(file)
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files
      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  // ── Step 4 — validate ───────────────────────────────────────────────────────
  function runValidation() {
    if (!state.parseResult || !state.schema) return
    const validationResult = validateRows(state.parseResult.rows, state.schema)
    setState((s) => ({ ...s, validationResult, step: 5 }))
  }

  // ── Step 5 — import ─────────────────────────────────────────────────────────
  async function handleImport() {
    if (!state.validationResult || !state.schema) return
    setLoading(true)

    const importResult = await importRows(
      state.validationResult.cleanRows,
      state.schema,
      (progress) => setState((s) => ({ ...s, progress }))
    )

    setState((s) => ({ ...s, importResult, isLoading: false, step: 6 }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Temporary data warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <span className="font-semibold">Importación temporal.</span>{" "}
          Los datos cargados aquí son de uso provisional. Este módulo no reemplaza la
          integración SAP → Supabase. Los registros importados pueden coexistir o
          sobreescribir datos existentes según la clave primaria de cada tabla.
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={state.step} />

      {/* Step content */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {state.step === 1 && (
              <Step1TableSelect onSelect={selectSchema} />
            )}
            {state.step === 2 && state.schema && (
              <Step2Template
                schema={state.schema}
                onDownload={handleDownloadTemplate}
                onNext={() => go(3)}
                onBack={() => go(1)}
              />
            )}
            {state.step === 3 && state.schema && (
              <Step3Upload
                schema={state.schema}
                file={state.file}
                parseResult={state.parseResult}
                isLoading={state.isLoading}
                fileInputRef={fileInputRef}
                onDrop={handleDrop}
                onChange={handleFileChange}
                onBack={() => go(2)}
                onClear={() => setState((s) => ({ ...s, file: null, parseResult: null }))}
              />
            )}
            {state.step === 4 && state.parseResult && state.schema && (
              <Step4Validate
                parseResult={state.parseResult}
                schema={state.schema}
                onBack={() => go(3)}
                onNext={runValidation}
              />
            )}
            {state.step === 5 && state.validationResult && state.schema && (
              <Step5Confirm
                validationResult={state.validationResult}
                schema={state.schema}
                progress={state.progress}
                isLoading={state.isLoading}
                onBack={() => go(4)}
                onImport={handleImport}
              />
            )}
            {state.step === 6 && state.importResult && (
              <Step6Result
                importResult={state.importResult}
                validationResult={state.validationResult}
                onReset={reset}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-[var(--chart-1)] text-white",
                  active && "bg-[var(--firplak-navy)] text-white",
                  !done && !active && "bg-foreground/10 text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px flex-1 min-w-4 transition-colors",
                  step.id < current ? "bg-[var(--chart-1)]" : "bg-foreground/10"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// Step 1 — Table selection
function Step1TableSelect({ onSelect }: { onSelect: (s: TableSchema) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader step={1} />
      <div className="grid gap-3 sm:grid-cols-3">
        {TABLE_SCHEMAS.map((schema) => (
          <button
            key={schema.table}
            onClick={() => onSelect(schema)}
            className="group glass-subtle flex flex-col gap-2 rounded-xl border border-foreground/8 p-5 text-left transition-all hover:border-[var(--firplak-navy)]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--firplak-navy)]"
          >
            <FileSpreadsheet className="size-6 text-[var(--firplak-navy)] opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="font-semibold tracking-tight">{schema.label}</span>
            <span className="text-[12px] text-muted-foreground">{schema.description}</span>
            <span className="text-[11px] text-muted-foreground">
              {schema.fields.length} columnas ·{" "}
              {schema.fields.filter((f) => f.required).length} requeridas
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 2 — Template download
function Step2Template({
  schema,
  onDownload,
  onNext,
  onBack,
}: {
  schema: TableSchema
  onDownload: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [downloaded, setDownloaded] = React.useState(false)

  function handleDownload() {
    onDownload()
    setDownloaded(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={2} />
      <div className="flex flex-col gap-3 rounded-xl border border-foreground/8 bg-foreground/3 p-5">
        <p className="text-sm text-muted-foreground">
          Descarga la plantilla Excel para <strong>{schema.label}</strong>. La plantilla
          incluye todos los encabezados en el orden correcto, una fila de ejemplo, y
          una hoja "Diccionario" con la descripción de cada campo.
        </p>
        <ul className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-[var(--chart-1)]" />
            {schema.fields.length} columnas — {schema.fields.filter((f) => f.required).length} requeridas
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-[var(--chart-1)]" />
            Hoja "Datos" + hoja "Diccionario"
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-[var(--chart-1)]" />
            Formato de fechas: YYYY-MM-DD
          </li>
        </ul>
        <Button
          variant="outline"
          className="w-fit gap-2"
          onClick={handleDownload}
        >
          <Download className="size-4" />
          Descargar plantilla .xlsx
        </Button>
        {downloaded && (
          <p className="text-[12px] text-[var(--chart-1)]">
            ✓ Plantilla descargada. Llénala y continúa.
          </p>
        )}
      </div>
      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continuar a subir archivo" />
    </div>
  )
}

// Step 3 — File upload
function Step3Upload({
  schema,
  file,
  parseResult,
  isLoading,
  fileInputRef,
  onDrop,
  onChange,
  onBack,
  onClear,
}: {
  schema: TableSchema
  file: File | null
  parseResult: ParseResult | null
  isLoading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  onClear: () => void
}) {
  const [dragOver, setDragOver] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={3} />
      <p className="text-sm text-muted-foreground">
        Sube el archivo para <strong>{schema.label}</strong>. Se aceptan .xlsx, .xls y .csv.
        Máximo {(50_000).toLocaleString()} filas.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); onDrop(e) }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragOver
            ? "border-[var(--firplak-navy)]/50 bg-[var(--firplak-navy)]/5"
            : "border-foreground/15 hover:border-foreground/25 hover:bg-foreground/3"
        )}
      >
        {isLoading ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-8 text-muted-foreground" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {isLoading ? "Procesando archivo…" : "Arrastra el archivo aquí o haz clic para seleccionar"}
          </span>
          <span className="text-[12px] text-muted-foreground">.xlsx · .xls · .csv</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={onChange}
        />
      </div>

      {/* Selected file chip */}
      {file && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/4 px-3 py-2 text-sm">
          <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-medium">{file.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="rounded p-0.5 hover:bg-foreground/10"
            aria-label="Quitar archivo"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Parse error */}
      {parseResult && !parseResult.ok && (
        <ErrorBox message={parseResult.error ?? "Error al leer el archivo."} />
      )}

      <StepNav onBack={onBack} nextLabel={null} />
    </div>
  )
}

// Step 4 — Preview & validate
function Step4Validate({
  parseResult,
  schema,
  onBack,
  onNext,
}: {
  parseResult: ParseResult
  schema: TableSchema
  onBack: () => void
  onNext: () => void
}) {
  const previewRows = parseResult.rows.slice(0, 5)
  const previewFields = schema.fields.filter(
    (f) => Object.keys(parseResult.columnMap).includes(f.key)
  ).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={4} />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-[12px]">
        <Chip variant="info">{parseResult.rows.length.toLocaleString()} filas detectadas</Chip>
        <Chip variant="info">
          {Object.keys(parseResult.columnMap).length} de {schema.fields.length} columnas mapeadas
        </Chip>
        {parseResult.unmappedHeaders.length > 0 && (
          <Chip variant="warn">
            {parseResult.unmappedHeaders.length} columnas no reconocidas
          </Chip>
        )}
        {parseResult.rawRowCount > parseResult.rows.length && (
          <Chip variant="info">
            {parseResult.rawRowCount - parseResult.rows.length} filas vacías omitidas
          </Chip>
        )}
      </div>

      {/* Unmapped headers */}
      {parseResult.unmappedHeaders.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-[12px] text-amber-700 dark:text-amber-400">
          <span className="font-semibold">Columnas no reconocidas</span> (se ignorarán):{" "}
          {parseResult.unmappedHeaders.map((h) => `"${h}"`).join(", ")}
        </div>
      )}

      {/* Preview table */}
      {previewRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-foreground/8">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="border-b border-foreground/8 bg-foreground/3">
                {previewFields.map((f) => (
                  <th
                    key={f.key}
                    className="whitespace-nowrap px-3 py-2 text-left font-semibold text-muted-foreground"
                  >
                    {f.label}
                    {f.required && <span className="ml-1 text-red-500">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="border-b border-foreground/5 last:border-0">
                  {previewFields.map((f) => (
                    <td
                      key={f.key}
                      className="max-w-[160px] truncate px-3 py-2 text-muted-foreground"
                    >
                      {String(row[f.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-foreground/8 px-3 py-2 text-[11px] text-muted-foreground">
            Mostrando las primeras {previewRows.length} filas de {parseResult.rows.length.toLocaleString()}
          </div>
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Validar datos" />
    </div>
  )
}

// Step 5 — Confirm import
function Step5Confirm({
  validationResult,
  schema,
  progress,
  isLoading,
  onBack,
  onImport,
}: {
  validationResult: ValidationResult
  schema: TableSchema
  progress: ImportProgress | null
  isLoading: boolean
  onBack: () => void
  onImport: () => void
}) {
  const pct = progress
    ? Math.round((progress.processed / progress.total) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <StepHeader step={5} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Filas listas"
          value={validationResult.cleanCount.toLocaleString()}
          variant="success"
        />
        <StatCard
          label="Filas con errores"
          value={validationResult.errorCount.toLocaleString()}
          variant={validationResult.errorCount > 0 ? "error" : "neutral"}
        />
        <StatCard
          label="Tabla destino"
          value={schema.table}
          variant="neutral"
        />
      </div>

      {/* Blocking errors */}
      {validationResult.errors.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">
            {validationResult.errorCount} fila(s) con errores serán omitidas:
          </p>
          <ul className="flex flex-col gap-1 text-[11px] text-red-600/80 dark:text-red-400/80">
            {validationResult.errors.slice(0, 8).map((e, i) => (
              <li key={i}>Fila {e.row}: {e.message}</li>
            ))}
            {validationResult.errors.length > 8 && (
              <li>… y {validationResult.errors.length - 8} error(es) más.</li>
            )}
          </ul>
        </div>
      )}

      {/* Soft warnings (e.g. exact full-row duplicates in sales_fact) */}
      {validationResult.warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/6 p-4">
          <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
            {validationResult.warningCount} fila(s) con advertencia — se importarán igualmente:
          </p>
          <ul className="flex flex-col gap-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">
            {validationResult.warnings.slice(0, 8).map((w, i) => (
              <li key={i}>Fila {w.row}: {w.message}</li>
            ))}
            {validationResult.warnings.length > 8 && (
              <li>… y {validationResult.warnings.length - 8} advertencia(s) más.</li>
            )}
          </ul>
        </div>
      )}

      {validationResult.cleanCount === 0 ? (
        <ErrorBox message="No hay filas válidas para importar. Corrige los errores en tu archivo y vuelve a cargarlo." />
      ) : (
        <div className="rounded-xl border border-[var(--firplak-navy)]/20 bg-[var(--firplak-navy)]/5 px-5 py-4 text-[13px] text-[var(--firplak-navy)] dark:text-blue-300">
          Se importarán las filas válidas. Los duplicados exactos solo se marcarán como advertencia.
        </div>
      )}

      {/* Progress bar */}
      {isLoading && progress && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[12px] text-muted-foreground">
            <span>Importando…</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-[var(--chart-1)]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ChevronLeft className="size-4" />
          Atrás
        </Button>
        <Button
          onClick={onImport}
          disabled={isLoading || validationResult.cleanCount === 0}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isLoading ? "Importando…" : "Confirmar importación"}
        </Button>
      </div>
    </div>
  )
}

// Step 6 — Result
function Step6Result({
  importResult,
  validationResult,
  onReset,
}: {
  importResult: ImportResult
  validationResult: ValidationResult | null
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <StepHeader step={6} />

      {importResult.ok ? (
        <>
          <CheckCircle2 className="size-14 text-[var(--chart-1)]" />
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">
              Importación completada
            </p>
            <p className="text-sm text-muted-foreground">
              {importResult.insertedCount.toLocaleString()} registro(s) insertados o actualizados correctamente.
            </p>
            {validationResult && validationResult.errorCount > 0 && (
              <p className="text-[12px] text-amber-600 dark:text-amber-400">
                {validationResult.errorCount} fila(s) omitidas por errores de validación.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <XCircle className="size-14 text-red-500" />
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">Importación con errores</p>
            <p className="text-sm text-muted-foreground">
              {importResult.insertedCount.toLocaleString()} fila(s) importadas.{" "}
              {importResult.batchErrors.length} lote(s) con error.
            </p>
          </div>
          <div className="w-full max-w-lg rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
            <p className="mb-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
              Errores de carga:
            </p>
            <ul className="flex flex-col gap-1 text-[11px] text-red-600/80 dark:text-red-400/80">
              {importResult.batchErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </>
      )}

      <Button onClick={onReset} variant="outline" className="gap-2">
        <Upload className="size-4" />
        Nueva importación
      </Button>
    </div>
  )
}

// ── Shared micro-components ───────────────────────────────────────────────────

function StepHeader({ step }: { step: StepId }) {
  const s = STEPS.find((s) => s.id === step)!
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Paso {step} de {STEPS.length}
      </span>
      <h2 className="font-heading text-xl font-semibold tracking-tight">{s.title}</h2>
    </div>
  )
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel: string | null
}) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Atrás
        </Button>
      )}
      {onNext && nextLabel && (
        <Button onClick={onNext} className="gap-1">
          {nextLabel}
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      <XCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function Chip({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: "info" | "warn" | "success"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ring-1",
        variant === "info" && "bg-foreground/6 text-foreground ring-foreground/10",
        variant === "warn" && "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
        variant === "success" && "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
      )}
    >
      {children}
    </span>
  )
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: "success" | "error" | "neutral"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4",
        variant === "success" && "border-emerald-500/20 bg-emerald-500/5",
        variant === "error" && "border-red-500/20 bg-red-500/5",
        variant === "neutral" && "border-foreground/10 bg-foreground/3"
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          variant === "success" && "text-emerald-700 dark:text-emerald-400",
          variant === "error" && "text-red-600 dark:text-red-400",
          variant === "neutral" && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}

// Re-export types used in the page
export type { ImportProgress, ValidationResult }
