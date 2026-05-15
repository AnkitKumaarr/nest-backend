import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MeetingSnapshotsService } from './meeting-snapshots.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { AnalyticsThrottle } from '../common/decorators/throttle.decorator';

@Controller('meeting-snapshots')
@UseGuards(CustomAuthGuard)
export class MeetingSnapshotsController {
  constructor(private readonly meetingSnapshotsService: MeetingSnapshotsService) {}

  // ─── Individual ───────────────────────────────────────────────────────────

  @AnalyticsThrottle()
  @Get('meeting-status')
  getIndividualStatus(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('meeting_status', req.user.sub);
  }

  @AnalyticsThrottle()
  @Get('duration-trend')
  getIndividualDurationTrend(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('duration_trend', req.user.sub);
  }

  @AnalyticsThrottle()
  @Get('frequency')
  getIndividualFrequency(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('frequency', req.user.sub);
  }

  @AnalyticsThrottle()
  @Get('time-of-day')
  getIndividualTimeOfDay(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('time_of_day', req.user.sub);
  }

  // ─── Company ──────────────────────────────────────────────────────────────

  @AnalyticsThrottle()
  @Get('company/:companyId/meeting-status')
  getCompanyStatus(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('meeting_status', companyId);
  }

  @AnalyticsThrottle()
  @Get('company/:companyId/duration-trend')
  getCompanyDurationTrend(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('duration_trend', companyId);
  }

  @AnalyticsThrottle()
  @Get('company/:companyId/frequency')
  getCompanyFrequency(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('frequency', companyId);
  }

  @AnalyticsThrottle()
  @Get('company/:companyId/participant-engagement')
  getCompanyParticipantEngagement(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('participant_engagement', companyId);
  }

  @AnalyticsThrottle()
  @Get('company/:companyId/time-of-day')
  getCompanyTimeOfDay(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('time_of_day', companyId);
  }

  @AnalyticsThrottle()
  @Get('company/:companyId/recurring-ratio')
  getCompanyRecurringRatio(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('recurring_ratio', companyId);
  }
}
