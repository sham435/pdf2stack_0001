import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceSchemaV2, SCHEMA_VERSION, InvoiceV2 } from '@repo/schema';
import { EXTRACTION_PROMPT, PROMPT_VERSION } from '@repo/prompt';
import { validateInvoice, VALIDATION_VERSION, ValidationResult } from '@repo/validation';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ExtractionResult = {
  id: string;
  status: string;
  data: InvoiceV2;
  validation_errors: string[];
  versions: { prompt: string; schema: string; validation: string };
};

@Injectable()
export class ExtractionService {
  constructor(public prisma: PrismaService) {}

  async extract(docId: string, text: string): Promise<ExtractionResult | { status: string; errors: any[] }> {
    const prompt = EXTRACTION_PROMPT.replace('{{DOCUMENT_TEXT}}', text);

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = JSON.parse(res.choices[0].message.content || '{}');
    const parsed = InvoiceSchemaV2.safeParse(raw);

    if (!parsed.success) {
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'schema_failed', validationErrors: parsed.error.errors.map(e => e.message) }
      });
      return { status: 'schema_failed', errors: parsed.error.errors };
    }

    const validation = validateInvoice(parsed.data);
    let status = validation.passed ? 'validated' : 'needs_review';

    if (validation.passed) {
      const dup = await this.prisma.document.findFirst({
        where: { 
          id: { not: docId },
          extractedJson: { path: ['vendor_name'], equals: parsed.data.vendor_name },
          AND: { extractedJson: { path: ['invoice_number'], equals: parsed.data.invoice_number } }
        }
      });
      if (dup) {
        status = 'needs_review';
        validation.errors.push('Duplicate invoice detected: matches ' + dup.id);
      }
    }

    await this.prisma.document.update({
      where: { id: docId },
      data: {
        extractedJson: parsed.data,
        status,
        validationErrors: validation.errors,
        promptVersion: PROMPT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        validationVersion: VALIDATION_VERSION
      }
    });

    if (status === 'validated' && process.env.EXPORT_WEBHOOK_URL) {
      await fetch(process.env.EXPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, data: parsed.data })
      });
    }

    return {
      id: docId,
      status,
      data: parsed.data,
      validation_errors: validation.errors,
      versions: { prompt: PROMPT_VERSION, schema: SCHEMA_VERSION, validation: VALIDATION_VERSION }
    } as ExtractionResult;
  }
}
