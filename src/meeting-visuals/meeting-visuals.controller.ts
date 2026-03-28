import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MeetingVisualsService } from './meeting-visuals.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('api/meeting-visuals')
@UseGuards(CustomAuthGuard)
export class MeetingVisualsController {
  constructor(private readonly meetingVisualsService: MeetingVisualsService) {}

  // ─── Individual (uses JWT userId) ────────────────────────────────────────

  /** GET /api/meeting-visuals/individual/meeting-status */
  @Get('individual/meeting-status')
  getIndividualStatus(@Request() req) {
    return this.meetingVisualsService.getIndividualVisual('meeting_status', req.user.sub);
  }

  /** GET /api/meeting-visuals/individual/duration-trend */
  @Get('individual/duration-trend')
  getIndividualDurationTrend(@Request() req) {
    return this.meetingVisualsService.getIndividualVisual('duration_trend', req.user.sub);
  }

  /** GET /api/meeting-visuals/individual/frequency */
  @Get('individual/frequency')
  getIndividualFrequency(@Request() req) {
    return this.meetingVisualsService.getIndividualVisual('frequency', req.user.sub);
  }

  /** GET /api/meeting-visuals/individual/time-of-day */
  @Get('individual/time-of-day')
  getIndividualTimeOfDay(@Request() req) {
    return this.meetingVisualsService.getIndividualVisual('time_of_day', req.user.sub);
  }

  // ─── Company ──────────────────────────────────────────────────────────────

  /** GET /api/meeting-visuals/company/:companyId/meeting-status */
  @Get('company/:companyId/meeting-status')
  getCompanyStatus(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('meeting_status', companyId);
  }

  /** GET /api/meeting-visuals/company/:companyId/duration-trend */
  @Get('company/:companyId/duration-trend')
  getCompanyDurationTrend(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('duration_trend', companyId);
  }

  /** GET /api/meeting-visuals/company/:companyId/frequency */
  @Get('company/:companyId/frequency')
  getCompanyFrequency(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('frequency', companyId);
  }

  /** GET /api/meeting-visuals/company/:companyId/participant-engagement */
  @Get('company/:companyId/participant-engagement')
  getCompanyParticipantEngagement(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('participant_engagement', companyId);
  }

  /** GET /api/meeting-visuals/company/:companyId/time-of-day */
  @Get('company/:companyId/time-of-day')
  getCompanyTimeOfDay(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('time_of_day', companyId);
  }

  /** GET /api/meeting-visuals/company/:companyId/recurring-ratio */
  @Get('company/:companyId/recurring-ratio')
  getCompanyRecurringRatio(@Param('companyId') companyId: string) {
    return this.meetingVisualsService.getCompanyVisual('recurring_ratio', companyId);
  }
}
