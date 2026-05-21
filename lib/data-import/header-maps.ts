/**
 * Per-table DB-column whitelists.
 *
 * Each Set contains the exact column names that exist in the corresponding
 * Supabase table. These are the only keys that will ever be sent to Supabase
 * during an import.
 *
 * The downloadable Excel templates generate one header column per entry in
 * these sets (via schema-definitions.ts). Uploaded files must use these
 * exact column names as their header row.
 *
 * To add or remove a column:
 *  1. Update the Set here.
 *  2. Update schema-definitions.ts (add/remove the FieldDef).
 *  3. Redeploy. No other files need touching.
 */

// ---------------------------------------------------------------------------
// sales_fact  (source of truth: confirmed Supabase schema)
// ---------------------------------------------------------------------------

export const SALES_FACT_COLUMNS: ReadonlySet<string> = new Set([
  "document_type",
  "document_date",
  "document_number",
  "senior_seller",
  "junior_seller",
  "sales_type",
  "zone",
  "territory",
  "customer_group",
  "customer_subgroup",
  "customer_code",
  "customer_name",
  "pos_code",
  "pos_description",
  "cost_center",
  "item_group",
  "product_family",
  "item_code",
  "item_description",
  "quantity",
  "sale_price",
  "discount_percent",
  "net_price",
  "total_value",
  "unit_cost",
  "total_cost",
  "gross_profit",
  "gross_margin",
  "project_name",
  "city",
  "phone",
  "novelty_end_date",
  "customer_segment",
  "credit_note_type_code",
  "credit_note_type",
  "credit_note_concept_code",
  "credit_note_concept",
  "comments",
  "source_query",
])

// ---------------------------------------------------------------------------
// orders_fact
// ---------------------------------------------------------------------------

export const ORDERS_FACT_COLUMNS: ReadonlySet<string> = new Set([
  "document_number",
  "planned_date",
  "creation_date",
  "customer_code",
  "customer_name",
  "customer_group",
  "customer_subgroup",
  "customer_segment",
  "destination_city",
  "zone",
  "territory",
  "channel",
  "order_type",
  "sales_type",
  "senior_seller",
  "junior_seller",
  "seller_code",
  "item_code",
  "item_description",
  "product_family",
  "product_line",
  "unit_of_measure",
  "ordered_quantity",
  "invoiced_quantity",
  "pending_quantity",
  "delivered_quantity",
  "unit_price",
  "total_order_value",
  "invoiced_value",
  "pending_value",
  "discount_value",
  "discount_pct",
  "currency",
  "exchange_rate",
  "fiscal_year",
  "fiscal_period",
  "plant",
  "profit_center",
  "delivery_block",
  "billing_block",
  "credit_block",
  "rejection_reason",
  "promised_date",
  "confirmed_date",
  "shipping_point",
  "incoterms",
  "payment_terms",
  "purchase_order",
  "reference",
  "status",
  "is_overdue",
])

// ---------------------------------------------------------------------------
// deliveries_fact
// ---------------------------------------------------------------------------

export const DELIVERIES_FACT_COLUMNS: ReadonlySet<string> = new Set([
  "delivery_number",
  "delivery_date",
  "order_number",
  "invoice_number",
  "customer_code",
  "customer_name",
  "customer_group",
  "customer_subgroup",
  "destination_city",
  "zone",
  "territory",
  "senior_seller",
  "seller_code",
  "item_code",
  "item_description",
  "product_family",
  "unit_of_measure",
  "delivered_quantity",
  "open_quantity",
  "unit_price",
  "delivered_value",
  "open_delivery_value",
  "currency",
  "plant",
  "shipping_point",
  "carrier",
  "tracking_number",
  "pod_date",
  "pod_status",
  "pod_recipient",
  "goods_issue_date",
  "planned_delivery_date",
  "actual_delivery_date",
  "delivery_status",
  "billing_status",
  "has_issue",
  "issue_description",
  "fiscal_year",
  "fiscal_period",
  "reference",
])

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const TABLE_COLUMNS: Record<string, ReadonlySet<string>> = {
  sales_fact:       SALES_FACT_COLUMNS,
  orders_fact:      ORDERS_FACT_COLUMNS,
  deliveries_fact:  DELIVERIES_FACT_COLUMNS,
}

/**
 * Returns the set of DB columns that are valid insert targets for the given
 * table. Any column not in this set will be dropped before Supabase insert.
 */
export function getDbColumns(table: string): ReadonlySet<string> {
  return TABLE_COLUMNS[table] ?? new Set()
}
