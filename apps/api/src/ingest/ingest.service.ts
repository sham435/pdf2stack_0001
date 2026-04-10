import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { AGENT_NAME } from '@repo/prompt';
import { pdf } from 'pdf-to-img';
import * as sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { PrismaService } from '../prisma/prisma.service';
import pdfParse = require('pdf-parse');

@Injectable()
export class IngestService {
  constructor(private prisma: PrismaService) {}

  async processUpload(
    file: Express.Multer.File,
    metadata: { source?: string; uploader?: string; customerId?: string }
  ) {
    const dataDir = path.join(process.cwd(), 'data', 'docs');
    const storedPath = path.join(dataDir, `${Date.now()}-${file.originalname}`);
    await fs.promises.mkdir(dataDir, { recursive: true });

    let buffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(file.buffer).rotate().toBuffer();
    }
    await fs.promises.writeFile(storedPath, buffer);

    const doc = await this.prisma.document.create({
      data: {
        agentName: AGENT_NAME,
        source: metadata.source || 'manual_upload',
        uploader: metadata.uploader || null,
        customerId: metadata.customerId || null,
        documentType: 'invoice',
        originalName: file.originalname,
        storedPath,
        status: 'received'
      }
    });

    return doc;
  }

  async ocrWithGate(filePath: string, mimeType: string): Promise<{ text: string; needsReview: boolean }> {
    let rawText = '';

    // Path 1: Direct image
    if (mimeType.startsWith('image/')) {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      rawText = text;
    }

    // Path 2 & 3: PDF
    else if (mimeType === 'application/pdf') {
      const buffer = await fs.promises.readFile(filePath);

      // Try digital PDF first - fast path
      try {
        const data = await (pdfParse as unknown as Function)(buffer);
        // If pdf-parse gets decent text, use it. Heuristic: >100 chars
        if (data.text && data.text.trim().length > 100) {
          rawText = data.text;
        }
      } catch {
        // pdf-parse failed, assume scanned
      }

      // If digital extraction failed or gave too little text, treat as scanned
      if (rawText.length < 100) {
        const document = await pdf(filePath, { scale: 2.0 }); // scale: 2 for better OCR
        const worker = await createWorker('eng');
        const pageTexts: string[] = [];

        for await (const page of document) {
          const { data: { text } } = await worker.recognize(page);
          pageTexts.push(text);
        }
        await worker.terminate();
        rawText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');
      }
    }

    else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const normalized = rawText
      .replace(/(\w)-\n(\w)/g, '$1$2')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const needsReview = normalized.length < 500;
    return { text: normalized, needsReview };
  }
}
