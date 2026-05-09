import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingSnapshotsModule } from '../meeting-snapshots/meeting-snapshots.module';
import { AnalyticsSnapshotsModule } from '../analytics-snapshots/analytics-snapshots.module';

@Module({
  imports: [MeetingSnapshotsModule, AnalyticsSnapshotsModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, JwtService],
})
export class MeetingsModule {}
