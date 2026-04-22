import { Controller, Get, Param, Request, UseGuards, Post, Body } from '@nestjs/common';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { OverviewDto } from './dto/overview.dto';

@Controller('api/analytics-snapshot')
@UseGuards(CustomAuthGuard)
export class AnalyticsSnapshotController {
  constructor(private readonly analyticsSnapshotService: AnalyticsSnapshotService) {}

  /**
   * GET /api/analytics-snapshot
   * Full detail-view snapshot for the logged-in user.
   * Combines project tasks + weekly tasks + meetings.
   */
  @Get()
  getMySnapshot(@Request() req) {
    return this.analyticsSnapshotService.getUserSnapshot(req.user.sub);
  }

  /**
   * GET /api/analytics-snapshot/team/:teamId
   * Full detail-view snapshot for a team.
   */
  @Get('team/:teamId')
  getTeamSnapshot(@Param('teamId') teamId: string) {
    return this.analyticsSnapshotService.getTeamSnapshot(teamId);
  }

  /**
   * GET /api/analytics-snapshot/company/:companyId
   * Full detail-view snapshot for an entire company.
   */
  @Get('company/:companyId')
  getCompanySnapshot(@Param('companyId') companyId: string) {
    return this.analyticsSnapshotService.getCompanySnapshot(companyId);
  }

  /**
   * POST /api/analytics-snapshot/overview
   * Overview data with optional filters (dateRange, teamId, userId).
   * Returns tasks, meetings, count per user, task status wise, meeting stats, and trends.
   */
  @Post('overview')
  getOverview(@Request() req, @Body() filters: OverviewDto) {
    return this.analyticsSnapshotService.getOverview(filters, req.user.sub);
  }
}
