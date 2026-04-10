import { z } from "zod";

export const SCHEMA_VERSION = "invoice_schema_v2";

export const LineItemSchema = z.object({
  description: z.string().nullable().describe("Line item description as printed. Do not infer."),
  quantity: z.number().nullable().describe("Numeric quantity. No commas or units."),
  unit_price: z.number().nullable().describe("Price per unit as number. No currency symbols."),
  line_total: z.number().nullable().describe("Quantity times unit_price. Numeric only.")
});

export const InvoiceSchemaV2 = z.object({
  vendor_name: z.string().nullable().describe("Vendor or supplier name as printed on invoice. Do not invent one."),
  invoice_number: z.string().nullable().describe("Unique invoice identifier as printed on the invoice. Do not invent one."),
  invoice_date: z.string().nullable().describe("ISO 8601: YYYY-MM-DD. Convert from document date."),
  due_date: z.string().nullable().describe("ISO 8601: YYYY-MM-DD or null."),
  currency: z.string().nullable().describe("3-letter ISO 4217 code like USD, EUR. If not stated, return null."),
  subtotal: z.number().nullable().describe("Subtotal before tax. Numeric only."),
  tax: z.number().nullable().describe("Tax amount. Numeric only."),
  total: z.number().nullable().describe("Total amount due including tax and fees. Prefer 'Amount Due' if present."),
  line_items: z.array(LineItemSchema).default([]),
  notes: z.string().nullable()
});

export type InvoiceV2 = z.infer<typeof InvoiceSchemaV2>;
export type LineItem = z.infer<typeof LineItemSchema>;
