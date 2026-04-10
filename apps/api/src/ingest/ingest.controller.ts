import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IngestService } from './ingest.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ingest')
export class IngestController {
  constructor(
    private readonly ingest: IngestService,
    private readonly prisma: PrismaService,
    @InjectQueue('extraction') private readonly extractionQueue: Queue
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { source?: string; uploader?: string; customerId?: string }
  ) {
    const doc = await this.ingest.processUpload(file, body);

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { status: 'queued' }
    });

    await this.extractionQueue.add('extract', {
      docId: doc.id,
      filePath: doc.storedPath,
      mimeType: file.mimetype
    });

    return {
      id: doc.id,
      status: 'queued',
      message: 'Document queued for processing'
    };
  }

  @Get('status/:id')
  async status(@Param('id') id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        originalName: true,
        extractedJson: true,
        validationErrors: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  @Get('file/:id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || !doc.storedPath) return res.status(404).send('Not Found');
    const fs = require('fs');
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.storedPath).pipe(res);
  }

  @Post('reprocess/:id')
  async reprocess(@Param('id') id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) return { error: 'Not Found' };
    
    await this.prisma.document.update({
      where: { id },
      data: { status: 'queued' }
    });
    
    await this.extractionQueue.add('extract', {
      docId: doc.id,
      filePath: doc.storedPath,
      mimeType: 'application/pdf'
    });
    
    return { status: 'queued' };
  }
}
