export const AGENT_NAME = "invoice_extraction_v1";
export const PROMPT_VERSION = "prompt_v3_line_items_fix";

export const EXTRACTION_PROMPT = `You are a document extraction system.
Task:
Extract invoice data from the provided document text. Output MUST be valid JSON that matches the schema below.
Rules:
- Return only JSON. No extra text.
- If a field is not present or cannot be confidently determined, return null.
- Do not infer or guess values that are not explicitly stated in the document.
- Use ISO 8601 dates: YYYY-MM-DD.
- Numbers must be numeric values (no currency symbols, no commas).
- Currency must be a 3-letter code (e.g., USD, EUR). If not stated, return null.
- Line items: extract each row as a separate object when possible.

Schema:
{
"vendor_name": string|null,
"invoice_number": string|null,
"invoice_date": string|null,
"due_date": string|null,
"currency": string|null,
"subtotal": number|null,
"tax": number|null,
"total": number|null,
"line_items": [
  {
    "description": string|null,
    "quantity": number|null,
    "unit_price": number|null,
    "line_total": number|null
  }
],
"notes": string|null
}

Document text:
{{DOCUMENT_TEXT}}`;

export const FEW_SHOT_EXAMPLES = [
  {
    name: "Clean invoice",
    text: "Vendor: Acme Corp\nInvoice #: 12345\nDate: 2026-01-15\nTotal Due: 1,150.00\nSubtotal: 1000.00\nTax: 150.00",
    output: { vendor_name: "Acme Corp", invoice_number: "12345", invoice_date: "2026-01-15", due_date: null, currency: null, subtotal: 1000, tax: 150, total: 1150, line_items: [], notes: null }
  },
  {
    name: "Messy balance due",
    text: "Bill To: XYZ\nInv 987\nDated: 03/02/2026\nBalance Due: $2,500.50\nTax included",
    output: { vendor_name: null, invoice_number: "987", invoice_date: "2026-03-02", due_date: null, currency: null, subtotal: null, tax: null, total: 2500.5, line_items: [], notes: "Tax included" }
  }
];
