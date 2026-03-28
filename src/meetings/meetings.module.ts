import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingVisualsModule } from '../meeting-visuals/meeting-visuals.module';
import { AnalyticsSnapshotModule } from '../analytics-snapshot/analytics-snapshot.module';

@Module({
  imports: [MeetingVisualsModule, AnalyticsSnapshotModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, JwtService],
})
export class MeetingsModule {}
