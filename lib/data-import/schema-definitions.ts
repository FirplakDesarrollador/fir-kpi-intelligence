/**
 * Data-import schema definitions.
 *
 * Each TableSchema describes the columns that the import wizard accepts for a
 * target Supabase table. The `fields` array defines every column with its
 * Spanish display label, expected JS type, and whether it is required.
 *
 * The template-generator and file-parser both consume these definitions, so
 * adding a new column only requires editing this file.
 */

export type FieldType = "string" | "number" | "date" | "boolean"

export type FieldDef = {
  /** Column name in Supabase (snake_case). */
  key: string
  /** Human-readable label shown in the wizard and written into the Excel template header. */
  label: string
  /** JS primitive category used for coercion and validation. */
  type: FieldType
  /** Whether the column must be non-empty to pass validation. */
  required: boolean
  /** Optional example value shown in the Diccionario sheet. */
  example?: string
}

export type TableSchema = {
  /** Supabase table name. */
  table: "sales_fact" | "orders_fact" | "deliveries_fact"
  /** Spanish display name shown in the UI. */
  label: string
  /** Short description shown in the wizard. */
  description: string
  /** Column definitions in the order they appear in the template. */
  fields: FieldDef[]
}

// ---------------------------------------------------------------------------
// sales_fact
// ---------------------------------------------------------------------------
const salesFactSchema: TableSchema = {
  table: "sales_fact",
  label: "Ventas",
  description: "Facturas de ventas emitidas (sales_fact)",
  fields: [
    { key: "document_date",      label: "Fecha de documento",        type: "date",    required: true,  example: "2024-03-15" },
    { key: "document_number",    label: "Número de documento",       type: "string",  required: true,  example: "0090012345" },
    { key: "order_number",       label: "Número de pedido",          type: "string",  required: false, example: "0010098765" },
    { key: "customer_code",      label: "Código de cliente",         type: "string",  required: true,  example: "C001234" },
    { key: "customer_name",      label: "Nombre de cliente",         type: "string",  required: true,  example: "Constructora Alfa S.A." },
    { key: "customer_group",     label: "Grupo de cliente",          type: "string",  required: false, example: "Constructoras" },
    { key: "customer_subgroup",  label: "Subgrupo de cliente",       type: "string",  required: false, example: "Grandes" },
    { key: "customer_segment",   label: "Segmento de cliente",       type: "string",  required: false, example: "Premium" },
    { key: "destination_city",   label: "Ciudad destino",            type: "string",  required: false, example: "Bogotá" },
    { key: "zone",               label: "Zona",                      type: "string",  required: false, example: "Centro" },
    { key: "territory",          label: "Territorio",                type: "string",  required: false, example: "Cundinamarca" },
    { key: "channel",            label: "Canal",                     type: "string",  required: false, example: "Distribuidores" },
    { key: "sales_type",         label: "Tipo de venta",             type: "string",  required: false, example: "Directa" },
    { key: "senior_seller",      label: "Vendedor principal",        type: "string",  required: false, example: "María López" },
    { key: "junior_seller",      label: "Vendedor junior",           type: "string",  required: false, example: "Carlos Ruiz" },
    { key: "seller_code",        label: "Código vendedor",           type: "string",  required: false, example: "V042" },
    { key: "item_code",          label: "Código de ítem",            type: "string",  required: true,  example: "FP-1200" },
    { key: "item_description",   label: "Descripción del ítem",      type: "string",  required: false, example: "Panel Firplak 12cm" },
    { key: "product_family",     label: "Familia de producto",       type: "string",  required: false, example: "Paneles" },
    { key: "product_line",       label: "Línea de producto",         type: "string",  required: false, example: "Estructural" },
    { key: "unit_of_measure",    label: "Unidad de medida",          type: "string",  required: false, example: "M2" },
    { key: "invoiced_quantity",  label: "Cantidad facturada",        type: "number",  required: false, example: "250" },
    { key: "total_quantity",     label: "Cantidad total",            type: "number",  required: false, example: "250" },
    { key: "unit_price",         label: "Precio unitario",           type: "number",  required: false, example: "87500" },
    { key: "total_value",        label: "Valor total",               type: "number",  required: true,  example: "21875000" },
    { key: "net_sales",          label: "Ventas netas",              type: "number",  required: false, example: "20500000" },
    { key: "discount_value",     label: "Valor descuento",           type: "number",  required: false, example: "1375000" },
    { key: "discount_pct",       label: "% Descuento",               type: "number",  required: false, example: "6.29" },
    { key: "total_cost",         label: "Costo total",               type: "number",  required: false, example: "14000000" },
    { key: "gross_profit",       label: "Utilidad bruta",            type: "number",  required: false, example: "6500000" },
    { key: "gross_margin",       label: "Margen bruto (%)",          type: "number",  required: false, example: "31.71" },
    { key: "currency",           label: "Moneda",                    type: "string",  required: false, example: "COP" },
    { key: "exchange_rate",      label: "Tasa de cambio",            type: "number",  required: false, example: "1" },
    { key: "fiscal_year",        label: "Año fiscal",                type: "number",  required: false, example: "2024" },
    { key: "fiscal_period",      label: "Período fiscal",            type: "number",  required: false, example: "3" },
    { key: "plant",              label: "Planta",                    type: "string",  required: false, example: "BOGO" },
    { key: "profit_center",      label: "Centro de beneficio",       type: "string",  required: false, example: "PC01" },
    { key: "reference",          label: "Referencia",                type: "string",  required: false, example: "OC-4521" },
  ],
}

// ---------------------------------------------------------------------------
// orders_fact
// ---------------------------------------------------------------------------
const ordersFactSchema: TableSchema = {
  table: "orders_fact",
  label: "Pedidos",
  description: "Pedidos de venta (orders_fact)",
  fields: [
    { key: "document_number",      label: "Número de documento",       type: "string",  required: true,  example: "0010098765" },
    { key: "planned_date",         label: "Fecha planificada",         type: "date",    required: true,  example: "2024-03-20" },
    { key: "creation_date",        label: "Fecha de creación",         type: "date",    required: false, example: "2024-03-10" },
    { key: "customer_code",        label: "Código de cliente",         type: "string",  required: true,  example: "C001234" },
    { key: "customer_name",        label: "Nombre de cliente",         type: "string",  required: true,  example: "Constructora Alfa S.A." },
    { key: "customer_group",       label: "Grupo de cliente",          type: "string",  required: false, example: "Constructoras" },
    { key: "customer_subgroup",    label: "Subgrupo de cliente",       type: "string",  required: false, example: "Grandes" },
    { key: "customer_segment",     label: "Segmento de cliente",       type: "string",  required: false, example: "Premium" },
    { key: "destination_city",     label: "Ciudad destino",            type: "string",  required: false, example: "Bogotá" },
    { key: "zone",                 label: "Zona",                      type: "string",  required: false, example: "Centro" },
    { key: "territory",            label: "Territorio",                type: "string",  required: false, example: "Cundinamarca" },
    { key: "channel",              label: "Canal",                     type: "string",  required: false, example: "Distribuidores" },
    { key: "order_type",           label: "Tipo de orden",             type: "string",  required: false, example: "ZOR" },
    { key: "sales_type",           label: "Tipo de venta",             type: "string",  required: false, example: "Directa" },
    { key: "senior_seller",        label: "Vendedor principal",        type: "string",  required: false, example: "María López" },
    { key: "junior_seller",        label: "Vendedor junior",           type: "string",  required: false, example: "Carlos Ruiz" },
    { key: "seller_code",          label: "Código vendedor",           type: "string",  required: false, example: "V042" },
    { key: "item_code",            label: "Código de ítem",            type: "string",  required: true,  example: "FP-1200" },
    { key: "item_description",     label: "Descripción del ítem",      type: "string",  required: false, example: "Panel Firplak 12cm" },
    { key: "product_family",       label: "Familia de producto",       type: "string",  required: false, example: "Paneles" },
    { key: "product_line",         label: "Línea de producto",         type: "string",  required: false, example: "Estructural" },
    { key: "unit_of_measure",      label: "Unidad de medida",          type: "string",  required: false, example: "M2" },
    { key: "ordered_quantity",     label: "Cantidad pedida",           type: "number",  required: true,  example: "300" },
    { key: "invoiced_quantity",    label: "Cantidad facturada",        type: "number",  required: false, example: "150" },
    { key: "pending_quantity",     label: "Cantidad pendiente",        type: "number",  required: false, example: "150" },
    { key: "delivered_quantity",   label: "Cantidad entregada",        type: "number",  required: false, example: "100" },
    { key: "unit_price",           label: "Precio unitario",           type: "number",  required: false, example: "87500" },
    { key: "total_order_value",    label: "Valor total de la orden",   type: "number",  required: true,  example: "26250000" },
    { key: "invoiced_value",       label: "Valor facturado",           type: "number",  required: false, example: "13125000" },
    { key: "pending_value",        label: "Valor pendiente",           type: "number",  required: false, example: "13125000" },
    { key: "discount_value",       label: "Valor descuento",           type: "number",  required: false, example: "1575000" },
    { key: "discount_pct",         label: "% Descuento",               type: "number",  required: false, example: "6.00" },
    { key: "currency",             label: "Moneda",                    type: "string",  required: false, example: "COP" },
    { key: "exchange_rate",        label: "Tasa de cambio",            type: "number",  required: false, example: "1" },
    { key: "fiscal_year",          label: "Año fiscal",                type: "number",  required: false, example: "2024" },
    { key: "fiscal_period",        label: "Período fiscal",            type: "number",  required: false, example: "3" },
    { key: "plant",                label: "Planta",                    type: "string",  required: false, example: "BOGO" },
    { key: "profit_center",        label: "Centro de beneficio",       type: "string",  required: false, example: "PC01" },
    { key: "delivery_block",       label: "Bloqueo de entrega",        type: "string",  required: false, example: "" },
    { key: "billing_block",        label: "Bloqueo de facturación",    type: "string",  required: false, example: "" },
    { key: "credit_block",         label: "Bloqueo de crédito",        type: "boolean", required: false, example: "false" },
    { key: "rejection_reason",     label: "Motivo de rechazo",         type: "string",  required: false, example: "" },
    { key: "promised_date",        label: "Fecha prometida",           type: "date",    required: false, example: "2024-03-22" },
    { key: "confirmed_date",       label: "Fecha confirmada",          type: "date",    required: false, example: "2024-03-22" },
    { key: "shipping_point",       label: "Punto de expedición",       type: "string",  required: false, example: "BOGO" },
    { key: "incoterms",            label: "Incoterms",                 type: "string",  required: false, example: "DDP" },
    { key: "payment_terms",        label: "Condiciones de pago",       type: "string",  required: false, example: "30 días" },
    { key: "purchase_order",       label: "Orden de compra cliente",   type: "string",  required: false, example: "OC-4521" },
    { key: "reference",            label: "Referencia",                type: "string",  required: false, example: "" },
    { key: "status",               label: "Estado",                    type: "string",  required: false, example: "Abierto" },
    { key: "is_overdue",           label: "¿Vencido?",                 type: "boolean", required: false, example: "false" },
  ],
}

// ---------------------------------------------------------------------------
// deliveries_fact
// ---------------------------------------------------------------------------
const deliveriesFactSchema: TableSchema = {
  table: "deliveries_fact",
  label: "Entregas",
  description: "Entregas (deliveries_fact)",
  fields: [
    { key: "delivery_number",      label: "Número de entrega",         type: "string",  required: true,  example: "0080054321" },
    { key: "delivery_date",        label: "Fecha de entrega",          type: "date",    required: true,  example: "2024-03-18" },
    { key: "order_number",         label: "Número de pedido",          type: "string",  required: false, example: "0010098765" },
    { key: "invoice_number",       label: "Número de factura",         type: "string",  required: false, example: "0090012345" },
    { key: "customer_code",        label: "Código de cliente",         type: "string",  required: true,  example: "C001234" },
    { key: "customer_name",        label: "Nombre de cliente",         type: "string",  required: true,  example: "Constructora Alfa S.A." },
    { key: "customer_group",       label: "Grupo de cliente",          type: "string",  required: false, example: "Constructoras" },
    { key: "customer_subgroup",    label: "Subgrupo de cliente",       type: "string",  required: false, example: "Grandes" },
    { key: "destination_city",     label: "Ciudad destino",            type: "string",  required: false, example: "Bogotá" },
    { key: "zone",                 label: "Zona",                      type: "string",  required: false, example: "Centro" },
    { key: "territory",            label: "Territorio",                type: "string",  required: false, example: "Cundinamarca" },
    { key: "senior_seller",        label: "Vendedor principal",        type: "string",  required: false, example: "María López" },
    { key: "seller_code",          label: "Código vendedor",           type: "string",  required: false, example: "V042" },
    { key: "item_code",            label: "Código de ítem",            type: "string",  required: true,  example: "FP-1200" },
    { key: "item_description",     label: "Descripción del ítem",      type: "string",  required: false, example: "Panel Firplak 12cm" },
    { key: "product_family",       label: "Familia de producto",       type: "string",  required: false, example: "Paneles" },
    { key: "unit_of_measure",      label: "Unidad de medida",          type: "string",  required: false, example: "M2" },
    { key: "delivered_quantity",   label: "Cantidad entregada",        type: "number",  required: true,  example: "250" },
    { key: "open_quantity",        label: "Cantidad abierta",          type: "number",  required: false, example: "50" },
    { key: "unit_price",           label: "Precio unitario",           type: "number",  required: false, example: "87500" },
    { key: "delivered_value",      label: "Valor entregado",           type: "number",  required: false, example: "21875000" },
    { key: "open_delivery_value",  label: "Valor entrega abierta",     type: "number",  required: true,  example: "4375000" },
    { key: "currency",             label: "Moneda",                    type: "string",  required: false, example: "COP" },
    { key: "plant",                label: "Planta",                    type: "string",  required: false, example: "BOGO" },
    { key: "shipping_point",       label: "Punto de expedición",       type: "string",  required: false, example: "BOGO" },
    { key: "carrier",              label: "Transportista",             type: "string",  required: false, example: "Servientrega" },
    { key: "tracking_number",      label: "Número de guía",            type: "string",  required: false, example: "SER123456" },
    { key: "pod_date",             label: "Fecha POD",                 type: "date",    required: false, example: "" },
    { key: "pod_status",           label: "Estado POD",                type: "string",  required: false, example: "Pendiente" },
    { key: "pod_recipient",        label: "Receptor POD",              type: "string",  required: false, example: "" },
    { key: "goods_issue_date",     label: "Fecha salida de mercancía", type: "date",    required: false, example: "2024-03-17" },
    { key: "planned_delivery_date",label: "Fecha entrega planificada", type: "date",    required: false, example: "2024-03-18" },
    { key: "actual_delivery_date", label: "Fecha entrega real",        type: "date",    required: false, example: "2024-03-18" },
    { key: "delivery_status",      label: "Estado de entrega",         type: "string",  required: false, example: "Completo" },
    { key: "billing_status",       label: "Estado de facturación",     type: "string",  required: false, example: "Facturado" },
    { key: "has_issue",            label: "¿Con novedad?",             type: "boolean", required: false, example: "false" },
    { key: "issue_description",    label: "Descripción de novedad",    type: "string",  required: false, example: "" },
    { key: "fiscal_year",          label: "Año fiscal",                type: "number",  required: false, example: "2024" },
    { key: "fiscal_period",        label: "Período fiscal",            type: "number",  required: false, example: "3" },
    { key: "reference",            label: "Referencia",                type: "string",  required: false, example: "" },
  ],
}

export const TABLE_SCHEMAS: TableSchema[] = [
  salesFactSchema,
  ordersFactSchema,
  deliveriesFactSchema,
]

export const SCHEMA_BY_TABLE = Object.fromEntries(
  TABLE_SCHEMAS.map((s) => [s.table, s])
) as Record<TableSchema["table"], TableSchema>
