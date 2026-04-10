import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { IngestService } from '../ingest/ingest.service';
import { ExtractionService } from '../extraction/extraction.service';

@Processor('extraction')
export class ExtractionProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingest: IngestService,
    private readonly extraction: ExtractionService,
  ) {
    super();
  }

  async process(job: Job<{ docId: string; filePath: string; mimeType: string }>) {
    const { docId, filePath, mimeType } = job.data;

    try {
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'processing' },
      });

      const { text, needsReview } = await this.ingest.ocrWithGate(filePath, mimeType);

      await this.prisma.document.update({
        where: { id: docId },
        data: { rawText: text, status: 'ocr_done' },
      });

      if (needsReview) {
        await this.prisma.document.update({
          where: { id: docId },
          data: { status: 'needs_review', validationErrors: ['OCR quality gate failed'] },
        });
        return { status: 'needs_review' };
      }

      const result = await this.extraction.extract(docId, text);
      return result;

    } catch (error: any) {
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'failed', validationErrors: [error.message] },
      });
      throw error;
    }
  }
}
