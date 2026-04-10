import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestController } from './ingest.controller';
import { ExtractionModule } from '../extraction/extraction.module';

import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [ExtractionModule, QueueModule],
  providers: [IngestService],
  controllers: [IngestController]
})
export class IngestModule {}
