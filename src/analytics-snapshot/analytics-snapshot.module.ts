import { Module } from '@nestjs/common';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsSnapshotController } from './analytics-snapshot.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AnalyticsSnapshotController],
  providers: [AnalyticsSnapshotService, PrismaService, JwtService],
  exports: [AnalyticsSnapshotService],
})
export class AnalyticsSnapshotModule {}
