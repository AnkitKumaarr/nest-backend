import { Module } from '@nestjs/common';
import { AnalyticsSnapshotsService } from './analytics-snapshots.service';
import { AnalyticsSnapshotsController } from './analytics-snapshots.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AnalyticsSnapshotsController],
  providers: [AnalyticsSnapshotsService, PrismaService, JwtService],
  exports: [AnalyticsSnapshotsService],
})
export class AnalyticsSnapshotsModule {}
