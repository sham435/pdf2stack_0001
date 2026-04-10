import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { ExtractionModule } from './extraction/extraction.module';
import { ExportModule } from './export/export.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    QueueModule,
    IngestModule,
    ExtractionModule,
    ExportModule
  ]
})
export class AppModule {}
