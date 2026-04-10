import { InvoiceV2 } from "@repo/schema";

export const VALIDATION_VERSION = "validation_rules_v1";
export const TOLERANCE = 0.05;

export type ValidationResult = { passed: boolean; errors: string[] };

export function validateInvoice(inv: InvoiceV2): ValidationResult {
  const errors: string[] = [];

  if (!inv.vendor_name) errors.push("vendor_name required");
  if (!inv.invoice_number) errors.push("invoice_number required");
  if (!inv.total || inv.total <= 0) errors.push("total must be > 0");

  if (inv.invoice_date && inv.due_date && inv.invoice_date > inv.due_date) {
    errors.push("invoice_date cannot be after due_date");
  }

  if (inv.subtotal !== null && inv.tax !== null && inv.total !== null) {
    const calc = inv.subtotal + inv.tax;
    if (Math.abs(calc - inv.total) > TOLERANCE) {
      errors.push(`total mismatch: ${inv.subtotal} + ${inv.tax} != ${inv.total}`);
    }
  }

  if (inv.line_items.length > 0 && inv.subtotal !== null) {
    const sum = inv.line_items.reduce((acc, li) => acc + (li.line_total ?? 0), 0);
    if (Math.abs(sum - inv.subtotal) > TOLERANCE) {
      errors.push(`line_items sum ${sum} != subtotal ${inv.subtotal}`);
    }
  }

  if (inv.currency && !/^[A-Z]{3}$/.test(inv.currency)) {
    errors.push("currency must be 3-letter ISO code");
  }

  return { passed: errors.length === 0, errors };
}
