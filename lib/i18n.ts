/**
 * FIR-KPI Intelligence — minimal i18n.
 *
 * Goal: keep this file the single source of truth for every visible string in
 * the app. Code identifiers, routes, and Supabase view names stay in English.
 *
 * This is intentionally _not_ a full runtime i18n framework yet — just a
 * dictionary indexed by locale, with a default locale and a `t` shortcut. We
 * can swap this for a context provider + locale switcher later without
 * touching the call sites, because everything goes through the `t` import.
 */

export type Locale = "es" | "en"

export const defaultLocale: Locale = "es"

export const locales: Locale[] = ["es", "en"]

export type NavItemId =
  | "dashboard"
  | "sales-vs-budget"
  | "forecasting"
  | "metrics"
  | "management"
  | "sales-analysis"
  | "downloads"
  | "kpi-builder"
  | "settings"
  | "data-import"

export type NavSectionId = "overview" | "performance" | "operations" | "tools"

type PageContent = {
  metaTitle: string
  eyebrow: string
  title: string
  description: string
  placeholder?: {
    title: string
    description: string
    bullets: string[]
  }
}

type AuthMessages = {
  loginTitle: string
  loginSubtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  loginButton: string
  loggingIn: string
  logoutButton: string
}

type Messages = {
  auth: AuthMessages
  brand: { name: string; tagline: string; fullName: string }
  nav: {
    ariaPrimary: string
    sections: Record<NavSectionId, string>
    items: Record<NavItemId, string>
    openNavigation: string
    navigationTitle: string
    navigationDescription: string
    supabaseConnected: string
  }
  topbar: {
    searchPlaceholder: string
    searchAriaLabel: string
    notifications: string
    themeToggle: string
  }
  theme: { light: string; dark: string; system: string }
  common: {
    export: string
    last30Days: string
    fallback: string
    fallbackTitle: string
    live: string
    vsBudget: string
    vsLastMonth: string
    vsLastWeek: string
    currentMonth: string
    needsReview: string
    clearStatus: string
    inTransit: string
    followUp: string
    allSigned: string
    completionUp: string
  }
  dashboard: {
    eyebrow: string
    title: string
    description: string
    kpiAria: string
    chartAria: string
    cards: {
      netSales: string
      attainment: string
      pending: string
      overdue: string
      open: string
      pod: string
    }
  }
  chart: {
    eyebrow: string
    title: string
    sales: string
    budget: string
    fallbackTooltip: string
  }
  health: {
    eyebrow: string
    title: string
    blocked: string
    deliveriesIssues: string
    podPending: string
    avgLeadTime: string
    updatesEvery: string
    mock: string
    mockTooltip: string
  }
  placeholder: { status: string }
  filters: FilterMessages
  drilldown: DrilldownMessages
  pages: Record<NavItemId, PageContent>
}

export type DrilldownId = "netSales" | "pending" | "overdue" | "open"

type DrilldownMessages = {
  /** Sheet header — accepts a `{label}` token replaced with the KPI name. */
  titleTemplate: string
  subtitle: string
  search: string
  exportCsv: string
  empty: string
  noResults: string
  prev: string
  next: string
  /** `{page}` / `{total}` tokens. */
  pageOf: string
  /** `{shown}` / `{total}` tokens. */
  rowsShown: string
  close: string
  /** Maps Supabase snake_case column names → human Spanish labels. */
  columns: Record<string, string>
}

export type FilterKey =
  | "year"
  | "month"
  | "channel"
  | "zone"
  | "territory"
  | "seller"
  | "productFamily"
  | "customerGroup"
  | "customerSubgroup"
  | "customerSegment"

type FilterMessages = {
  title: string
  subtitle: string
  all: string
  reset: string
  active: { one: string; many: string }
  labels: Record<FilterKey, string>
}

const es: Messages = {
  auth: {
    loginTitle: "Iniciar sesión",
    loginSubtitle: "Ingresa tus credenciales para acceder a la plataforma.",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@firplak.com",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "••••••••",
    loginButton: "Iniciar sesión",
    loggingIn: "Ingresando…",
    logoutButton: "Cerrar sesión",
  },
  brand: {
    name: "FIR-KPI",
    tagline: "Inteligencia",
    fullName: "FIR-KPI Intelligence",
  },
  nav: {
    ariaPrimary: "Principal",
    sections: {
      overview: "Resumen",
      performance: "Desempeño",
      operations: "Operaciones",
      tools: "Herramientas",
    },
    items: {
      dashboard: "Tablero",
      "sales-vs-budget": "Ventas vs Presupuesto",
      forecasting: "Proyección",
      metrics: "Métricas",
      management: "Gestión",
      "sales-analysis": "Análisis de Ventas",
      downloads: "Descargas",
      "kpi-builder": "Constructor de KPIs",
      settings: "Configuración",
      "data-import": "Importar Datos",
    },
    openNavigation: "Abrir navegación",
    navigationTitle: "Navegación",
    navigationDescription: "Explorar módulos",
    supabaseConnected: "Supabase conectado",
  },
  topbar: {
    searchPlaceholder: "Buscar KPIs, pedidos, módulos…",
    searchAriaLabel: "Buscar",
    notifications: "Notificaciones",
    themeToggle: "Cambiar tema",
  },
  theme: {
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  },
  common: {
    export: "Exportar",
    last30Days: "Últimos 30 días",
    fallback: "respaldo",
    fallbackTitle: "Mostrando datos de respaldo",
    live: "en vivo",
    vsBudget: "vs presupuesto",
    vsLastMonth: "vs mes anterior",
    vsLastWeek: "vs semana anterior",
    currentMonth: "mes actual",
    needsReview: "requiere revisión",
    clearStatus: "sin pendientes",
    inTransit: "en tránsito",
    followUp: "seguimiento",
    allSigned: "todos firmados",
    completionUp: "cumplimiento ↑",
  },
  dashboard: {
    eyebrow: "Resumen",
    title: "Bienvenido de nuevo, Luis",
    description:
      "Vista general del pulso comercial y operativo de FIRPLAK — en vivo desde Supabase.",
    kpiAria: "Indicadores clave de desempeño",
    chartAria: "Gráfico de desempeño",
    cards: {
      netSales: "Ventas Netas (MTD)",
      attainment: "Cumplimiento de Proyección",
      pending: "Pedidos Pendientes",
      overdue: "Pedidos Vencidos",
      open: "Entregas Abiertas",
      pod: "POD Pendiente",
    },
  },
  chart: {
    eyebrow: "Desempeño",
    title: "Ventas vs Presupuesto · Últimos 12 meses",
    sales: "Ventas",
    budget: "Presupuesto",
    fallbackTooltip:
      "Mostrando respaldo — sales_kpi_monthly no devolvió registros",
  },
  health: {
    eyebrow: "Salud operativa",
    title: "Hoy de un vistazo",
    blocked: "Pedidos bloqueados",
    deliveriesIssues: "Entregas con novedades",
    podPending: "POD pendiente",
    avgLeadTime: "Tiempo promedio",
    updatesEvery: "Actualiza cada 5 minutos",
    mock: "respaldo",
    mockTooltip: "Mostrando respaldo — la vista no devolvió registros",
  },
  placeholder: {
    status: "Estructura lista · pendiente de conexión de datos",
  },
  filters: {
    title: "Filtros globales",
    subtitle: "Refina los KPIs por dimensión",
    all: "Todos",
    reset: "Limpiar filtros",
    active: { one: "1 filtro activo", many: "{n} filtros activos" },
    labels: {
      year: "Año",
      month: "Mes",
      channel: "Canal",
      zone: "Zona",
      territory: "Territorio",
      seller: "Vendedor",
      productFamily: "Familia de producto",
      customerGroup: "Grupo de cliente",
      customerSubgroup: "Subgrupo de cliente",
      customerSegment: "Segmento de cliente",
    },
  },
  drilldown: {
    titleTemplate: "Detalle · {label}",
    subtitle: "Datos a nivel de fila desde Supabase",
    search: "Buscar…",
    exportCsv: "Exportar CSV",
    empty: "Aún no hay datos",
    noResults: "No se encontraron registros",
    prev: "Anterior",
    next: "Siguiente",
    pageOf: "Página {page} de {total}",
    rowsShown: "{shown} de {total} filas",
    close: "Cerrar",
    columns: {
      month: "Mes",
      senior_seller: "Vendedor principal",
      junior_seller: "Vendedor junior",
      seller_name: "Vendedor",
      zone: "Zona",
      territory: "Territorio",
      sales_type: "Tipo de venta",
      order_type: "Tipo de orden",
      product_family: "Familia de producto",
      customer_code: "Código cliente",
      customer_name: "Nombre cliente",
      customer_group: "Grupo de cliente",
      customer_subgroup: "Subgrupo de cliente",
      customer_segment: "Segmento de cliente",
      destination_city: "Ciudad destino",
      city: "Ciudad",
      net_sales: "Ventas netas",
      total_quantity: "Cantidad total",
      total_cost: "Costo total",
      gross_profit: "Utilidad bruta",
      gross_margin: "Margen bruto",
      ordered_quantity: "Cant. pedida",
      invoiced_quantity: "Cant. facturada",
      pending_quantity: "Cant. pendiente",
      total_order_value: "Valor de la orden",
      delivered_quantity: "Cant. entregada",
      open_delivery_value: "Valor entrega abierta",
    },
  },
  pages: {
    dashboard: {
      metaTitle: "Tablero",
      eyebrow: "Resumen",
      title: "Bienvenido de nuevo, Luis",
      description:
        "Vista general del pulso comercial y operativo de FIRPLAK — en vivo desde Supabase.",
    },
    "sales-vs-budget": {
      metaTitle: "Ventas vs Presupuesto",
      eyebrow: "Desempeño",
      title: "Ventas vs Presupuesto",
      description:
        "Seguimiento del desempeño en ventas contra los objetivos presupuestarios mensuales y trimestrales por producto y región.",
      placeholder: {
        title: "Seguimiento de varianza, calibrado.",
        description:
          "Este módulo mostrará la varianza mensual, desgloses por familia y mapas de calor de cumplimiento, alimentado por sales_kpi_monthly.",
        bullets: [
          "Mapa de calor de varianza mensual",
          "Desglose por familia de producto",
          "Cortes por región y canal",
          "Trazabilidad de calibración presupuestaria",
        ],
      },
    },
    forecasting: {
      metaTitle: "Proyección",
      eyebrow: "Desempeño",
      title: "Proyección",
      description:
        "Proyecciones de ventas a futuro, estacionalidad y modelado de escenarios.",
      placeholder: {
        title: "Proyecciones que puedes defender.",
        description:
          "Ejecuta proyecciones móviles a 3 / 6 / 12 meses con bandas de confianza, palancas de simulación y seguimiento histórico de precisión.",
        bullets: [
          "Proyección móvil (3 / 6 / 12 meses)",
          "Intervalos de confianza",
          "Escenarios de simulación",
          "Precisión histórica (backtest)",
        ],
      },
    },
    metrics: {
      metaTitle: "Métricas",
      eyebrow: "Desempeño",
      title: "Métricas",
      description:
        "Las métricas operativas y comerciales que mueven el negocio.",
      placeholder: {
        title: "Todas las métricas, una superficie.",
        description:
          "KPIs curados de ventas, operaciones, entregas y finanzas — con umbrales y señales de tendencia.",
        bullets: [
          "Catálogo curado de KPIs",
          "Umbrales y alertas",
          "Vista de tendencia y sparkline",
          "Responsables y rendición de cuentas",
        ],
      },
    },
    management: {
      metaTitle: "Gestión",
      eyebrow: "Operaciones",
      title: "Gestión",
      description:
        "Centro de control operativo — pedidos, entregas, bloqueos y excepciones.",
      placeholder: {
        title: "Maneja el día desde una sola pantalla.",
        description:
          "Colas operativas en vivo desde Supabase: pedidos pendientes y vencidos, ítems bloqueados, entregas con novedades y POD pendientes.",
        bullets: [
          "Pedidos pendientes y vencidos",
          "Triage de pedidos bloqueados",
          "Entregas con novedades",
          "Seguimiento de POD pendientes",
        ],
      },
    },
    "sales-analysis": {
      metaTitle: "Análisis de Ventas",
      eyebrow: "Desempeño",
      title: "Análisis de Ventas",
      description:
        "Analiza las ventas por región, canal, familia de producto, cliente y período.",
      placeholder: {
        title: "Encuentra la señal en tus ventas.",
        description:
          "Pivota por dimensiones, compara períodos y aísla los movimientos que importan — respaldado por sales_kpi_monthly.",
        bullets: [
          "Pivote por dimensiones",
          "Período contra período",
          "Top clientes y productos",
          "Vistas de cohorte y retención",
        ],
      },
    },
    downloads: {
      metaTitle: "Descargas",
      eyebrow: "Operaciones",
      title: "Descargas",
      description:
        "Exporta reportes y conjuntos de datos — PDF, XLSX y CSV.",
      placeholder: {
        title: "Reportes listos para compartir.",
        description:
          "Exportes programadas de digests de KPI, paquetes de ventas y reportes de excepciones de entrega en PDF y XLSX.",
        bullets: [
          "Reportes PDF con marca",
          "Exportes XLSX",
          "Entregas programadas",
          "Registro de auditoría de exportes",
        ],
      },
    },
    "kpi-builder": {
      metaTitle: "Constructor de KPIs",
      eyebrow: "Herramientas",
      title: "Constructor de KPIs",
      description:
        "Diseña KPIs a medida desde tus vistas de Supabase, con umbrales y presets visuales.",
      placeholder: {
        title: "Compón tus propios KPIs.",
        description:
          "Elige una vista de Supabase, selecciona dimensiones, define fórmulas y publica al tablero — sin SQL.",
        bullets: [
          "Constructor de fórmulas drag-and-drop",
          "Umbrales y alertas configurables",
          "Presets visuales reutilizables",
          "Historial de versiones",
        ],
      },
    },
    settings: {
      metaTitle: "Configuración",
      eyebrow: "Herramientas",
      title: "Configuración",
      description:
        "Preferencias del espacio de trabajo, tema, miembros e integraciones.",
      placeholder: {
        title: "Afina el espacio de trabajo.",
        description:
          "Perfil, apariencia, miembros y roles, y controles de integración con Supabase — todo en un solo lugar.",
        bullets: [
          "Perfil y preferencias",
          "Tema y densidad",
          "Miembros y roles",
          "Integraciones (Supabase, etc.)",
        ],
      },
    },
    "data-import": {
      metaTitle: "Importar Datos",
      eyebrow: "Herramientas",
      title: "Importación de Datos",
      description:
        "Carga masiva temporal de ventas, pedidos y entregas desde archivos Excel o CSV.",
    },
  },
}

/**
 * English mirror — kept intentionally close to the original copy so the app
 * can swap locales without redesign. Not yet wired to a locale switcher.
 */
const en: Messages = {
  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Enter your credentials to access the platform.",
    emailLabel: "Email address",
    emailPlaceholder: "you@firplak.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    loginButton: "Sign in",
    loggingIn: "Signing in…",
    logoutButton: "Sign out",
  },
  brand: {
    name: "FIR-KPI",
    tagline: "Intelligence",
    fullName: "FIR-KPI Intelligence",
  },
  nav: {
    ariaPrimary: "Primary",
    sections: {
      overview: "Overview",
      performance: "Performance",
      operations: "Operations",
      tools: "Tools",
    },
    items: {
      dashboard: "Dashboard",
      "sales-vs-budget": "Sales vs Budget",
      forecasting: "Forecasting",
      metrics: "Metrics",
      management: "Management",
      "sales-analysis": "Sales Analysis",
      downloads: "Downloads",
      "kpi-builder": "KPI Builder",
      settings: "Settings",
      "data-import": "Import Data",
    },
    openNavigation: "Open navigation",
    navigationTitle: "Navigation",
    navigationDescription: "Browse modules",
    supabaseConnected: "Supabase connected",
  },
  topbar: {
    searchPlaceholder: "Search KPIs, orders, modules…",
    searchAriaLabel: "Search",
    notifications: "Notifications",
    themeToggle: "Toggle theme",
  },
  theme: { light: "Light", dark: "Dark", system: "System" },
  common: {
    export: "Export",
    last30Days: "Last 30 days",
    fallback: "fallback",
    fallbackTitle: "Showing fallback data",
    live: "live",
    vsBudget: "vs budget",
    vsLastMonth: "vs last month",
    vsLastWeek: "vs last week",
    currentMonth: "current month",
    needsReview: "needs review",
    clearStatus: "clear",
    inTransit: "in transit",
    followUp: "follow up",
    allSigned: "all signed",
    completionUp: "completion ↑",
  },
  dashboard: {
    eyebrow: "Overview",
    title: "Welcome back, Luis",
    description:
      "Snapshot of FIRPLAK's commercial and operational pulse — live from Supabase.",
    kpiAria: "Key performance indicators",
    chartAria: "Performance chart",
    cards: {
      netSales: "Net Sales (MTD)",
      attainment: "Forecast Attainment",
      pending: "Pending Orders",
      overdue: "Overdue Orders",
      open: "Open Deliveries",
      pod: "POD Pending",
    },
  },
  chart: {
    eyebrow: "Performance",
    title: "Sales vs Budget · last 12 months",
    sales: "Sales",
    budget: "Budget",
    fallbackTooltip:
      "Using elegant fallback — sales_kpi_monthly returned no rows",
  },
  health: {
    eyebrow: "Operational health",
    title: "Today at a glance",
    blocked: "Blocked orders",
    deliveriesIssues: "Deliveries with issues",
    podPending: "POD pending",
    avgLeadTime: "Avg lead time",
    updatesEvery: "Updates every 5 minutes",
    mock: "mock",
    mockTooltip: "Using elegant fallback — view returned no rows",
  },
  placeholder: {
    status: "Module shell ready · awaiting data wiring",
  },
  filters: {
    title: "Global filters",
    subtitle: "Refine KPIs by dimension",
    all: "All",
    reset: "Reset filters",
    active: { one: "1 active filter", many: "{n} active filters" },
    labels: {
      year: "Year",
      month: "Month",
      channel: "Channel",
      zone: "Zone",
      territory: "Territory",
      seller: "Seller",
      productFamily: "Product family",
      customerGroup: "Customer group",
      customerSubgroup: "Customer subgroup",
      customerSegment: "Customer segment",
    },
  },
  drilldown: {
    titleTemplate: "Detail · {label}",
    subtitle: "Row-level data from Supabase",
    search: "Search…",
    exportCsv: "Export CSV",
    empty: "No data yet",
    noResults: "No matching records",
    prev: "Previous",
    next: "Next",
    pageOf: "Page {page} of {total}",
    rowsShown: "{shown} of {total} rows",
    close: "Close",
    columns: {
      month: "Month",
      senior_seller: "Senior seller",
      junior_seller: "Junior seller",
      seller_name: "Seller",
      zone: "Zone",
      territory: "Territory",
      sales_type: "Sales type",
      order_type: "Order type",
      product_family: "Product family",
      customer_code: "Customer code",
      customer_name: "Customer name",
      customer_group: "Customer group",
      customer_subgroup: "Customer subgroup",
      customer_segment: "Customer segment",
      destination_city: "Destination city",
      city: "City",
      net_sales: "Net sales",
      total_quantity: "Total quantity",
      total_cost: "Total cost",
      gross_profit: "Gross profit",
      gross_margin: "Gross margin",
      ordered_quantity: "Ordered qty",
      invoiced_quantity: "Invoiced qty",
      pending_quantity: "Pending qty",
      total_order_value: "Order value",
      delivered_quantity: "Delivered qty",
      open_delivery_value: "Open delivery value",
    },
  },
  pages: {
    dashboard: {
      metaTitle: "Dashboard",
      eyebrow: "Overview",
      title: "Welcome back, Luis",
      description:
        "Snapshot of FIRPLAK's commercial and operational pulse — live from Supabase.",
    },
    "sales-vs-budget": {
      metaTitle: "Sales vs Budget",
      eyebrow: "Performance",
      title: "Sales vs Budget",
      description:
        "Track sales against monthly and quarterly budget targets across products and regions.",
      placeholder: {
        title: "Variance tracking, calibrated.",
        description:
          "This module will surface monthly variance, drill-downs by family, and attainment heatmaps powered by sales_kpi_monthly.",
        bullets: [
          "Monthly variance heatmap",
          "Drill into product family",
          "Region & channel splits",
          "Budget calibration trail",
        ],
      },
    },
    forecasting: {
      metaTitle: "Forecasting",
      eyebrow: "Performance",
      title: "Forecasting",
      description:
        "Forward-looking sales projections, seasonality, and scenario modeling.",
      placeholder: {
        title: "Forecasts you can defend.",
        description:
          "Run rolling 3/6/12-month projections with confidence bands, what-if levers, and historical accuracy tracking.",
        bullets: [
          "Rolling forecast (3 / 6 / 12 mo)",
          "Confidence intervals",
          "What-if scenarios",
          "Backtest accuracy",
        ],
      },
    },
    metrics: {
      metaTitle: "Metrics",
      eyebrow: "Performance",
      title: "Metrics",
      description:
        "The core operational and commercial metrics that move the business.",
      placeholder: {
        title: "Every metric, one surface.",
        description:
          "Curated KPIs across sales, operations, deliveries, and finance — with thresholds and trend signals.",
        bullets: [
          "Curated KPI catalog",
          "Thresholds & alerts",
          "Trend & sparkline view",
          "Owners & accountability",
        ],
      },
    },
    management: {
      metaTitle: "Management",
      eyebrow: "Operations",
      title: "Management",
      description:
        "Operational control center — orders, deliveries, blocks, and exceptions.",
      placeholder: {
        title: "Run the day, on one screen.",
        description:
          "Live operational queues from Supabase: pending and overdue orders, blocked items, deliveries with issues, and pending PODs.",
        bullets: [
          "Pending & overdue orders",
          "Blocked orders triage",
          "Deliveries with issues",
          "POD pending follow-up",
        ],
      },
    },
    "sales-analysis": {
      metaTitle: "Sales Analysis",
      eyebrow: "Performance",
      title: "Sales Analysis",
      description:
        "Slice and dice sales by region, channel, product family, customer, and time.",
      placeholder: {
        title: "Find the signal in your sales.",
        description:
          "Pivot through dimensions, compare periods, and isolate the moves that matter — backed by sales_kpi_monthly.",
        bullets: [
          "Pivot across dimensions",
          "Period-over-period",
          "Top customers & products",
          "Cohort & retention views",
        ],
      },
    },
    downloads: {
      metaTitle: "Downloads",
      eyebrow: "Operations",
      title: "Downloads",
      description:
        "Export polished reports and datasets — PDF, XLSX, and raw CSV.",
      placeholder: {
        title: "Reports, ready to share.",
        description:
          "Scheduled exports of KPI digests, sales packs, and delivery exception reports in PDF and XLSX.",
        bullets: [
          "Branded PDF reports",
          "XLSX exports",
          "Scheduled deliveries",
          "Audit log of exports",
        ],
      },
    },
    "kpi-builder": {
      metaTitle: "KPI Builder",
      eyebrow: "Tools",
      title: "KPI Builder",
      description:
        "Design custom KPIs from your Supabase views, with thresholds and visual presets.",
      placeholder: {
        title: "Compose your own KPIs.",
        description:
          "Pick a Supabase view, choose dimensions, define formulas, and publish to dashboards — no SQL required.",
        bullets: [
          "Drag-and-drop formula builder",
          "Threshold & alert configs",
          "Reusable visual presets",
          "Version history",
        ],
      },
    },
    settings: {
      metaTitle: "Settings",
      eyebrow: "Tools",
      title: "Settings",
      description:
        "Workspace preferences, theme, members, and integrations.",
      placeholder: {
        title: "Tune the workspace.",
        description:
          "Profile, appearance, members & roles, and Supabase integration controls — all in one place.",
        bullets: [
          "Profile & preferences",
          "Theme & density",
          "Members & roles",
          "Integrations (Supabase, etc.)",
        ],
      },
    },
    "data-import": {
      metaTitle: "Import Data",
      eyebrow: "Tools",
      title: "Data Import",
      description:
        "Bulk temporary load of sales, orders, and deliveries from Excel or CSV files.",
    },
  },
}

export const messages: Record<Locale, Messages> = { es, en }

/**
 * Default-locale dictionary. Import this everywhere a string is rendered.
 *
 *   import { t } from "@/lib/i18n"
 *   <h1>{t.dashboard.title}</h1>
 *
 * When we add a locale switcher, this constant becomes a hook that reads from
 * a context, and call sites stay identical.
 */
export const t: Messages = messages[defaultLocale]
