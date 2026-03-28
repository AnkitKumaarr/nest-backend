import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MeetingVisualsModule } from '../meeting-visuals/meeting-visuals.module';
import { AnalyticsSnapshotModule } from '../analytics-snapshot/analytics-snapshot.module';

@Module({
  imports: [MeetingVisualsModule, AnalyticsSnapshotModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, PrismaService, JwtService],
})
export class MeetingsModule {}