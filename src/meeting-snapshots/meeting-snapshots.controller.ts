import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MeetingSnapshotsService } from './meeting-snapshots.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('meeting-snapshots')
@UseGuards(CustomAuthGuard)
export class MeetingSnapshotsController {
  constructor(private readonly meetingSnapshotsService: MeetingSnapshotsService) {}

  // ─── Individual ───────────────────────────────────────────────────────────

  /** GET /meeting-snapshots/meeting-status */
  @Get('meeting-status')
  getIndividualStatus(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('meeting_status', req.user.sub);
  }

  /** GET /meeting-snapshots/duration-trend */
  @Get('duration-trend')
  getIndividualDurationTrend(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('duration_trend', req.user.sub);
  }

  /** GET /meeting-snapshots/frequency */
  @Get('frequency')
  getIndividualFrequency(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('frequency', req.user.sub);
  }

  /** GET /meeting-snapshots/time-of-day */
  @Get('time-of-day')
  getIndividualTimeOfDay(@Request() req) {
    return this.meetingSnapshotsService.getIndividualVisual('time_of_day', req.user.sub);
  }

  // ─── Company ──────────────────────────────────────────────────────────────

  /** GET /meeting-snapshots/company/:companyId/meeting-status */
  @Get('company/:companyId/meeting-status')
  getCompanyStatus(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('meeting_status', companyId);
  }

  /** GET /meeting-snapshots/company/:companyId/duration-trend */
  @Get('company/:companyId/duration-trend')
  getCompanyDurationTrend(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('duration_trend', companyId);
  }

  /** GET /meeting-snapshots/company/:companyId/frequency */
  @Get('company/:companyId/frequency')
  getCompanyFrequency(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('frequency', companyId);
  }

  /** GET /meeting-snapshots/company/:companyId/participant-engagement */
  @Get('company/:companyId/participant-engagement')
  getCompanyParticipantEngagement(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('participant_engagement', companyId);
  }

  /** GET /meeting-snapshots/company/:companyId/time-of-day */
  @Get('company/:companyId/time-of-day')
  getCompanyTimeOfDay(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('time_of_day', companyId);
  }

  /** GET /meeting-snapshots/company/:companyId/recurring-ratio */
  @Get('company/:companyId/recurring-ratio')
  getCompanyRecurringRatio(@Param('companyId') companyId: string) {
    return this.meetingSnapshotsService.getCompanyVisual('recurring_ratio', companyId);
  }
}
