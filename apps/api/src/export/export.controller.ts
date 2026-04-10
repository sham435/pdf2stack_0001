import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('export')
export class ExportController {
  constructor(private prisma: PrismaService) {}

  @Post('webhook')
  async export(@Body() body: { docId: string }) {
    const doc = await this.prisma.document.findUnique({ where: { id: body.docId } });
    if (!doc?.extractedJson) throw new Error('No data');

    const res = await fetch(process.env.EXPORT_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc.extractedJson)
    });
    return { status: res.ok ? 'exported' : 'failed' };
  }
}
