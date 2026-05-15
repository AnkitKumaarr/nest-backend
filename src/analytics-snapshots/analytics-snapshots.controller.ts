import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AnalyticsSnapshotsService } from './analytics-snapshots.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { AnalyticsThrottle } from '../common/decorators/throttle.decorator';

@Controller('analytics-snapshots')
@UseGuards(CustomAuthGuard)
export class AnalyticsSnapshotsController {
  constructor(private readonly analyticsSnapshotsService: AnalyticsSnapshotsService) {}

  /** GET /analytics-snapshots — personal snapshot */
  @AnalyticsThrottle()
  @Get()
  getMySnapshot(@Request() req) {
    return this.analyticsSnapshotsService.getUserSnapshot(req.user.sub);
  }

  /** GET /analytics-snapshots/overview */
  @AnalyticsThrottle()
  @Get('overview')
  getOverview(
    @Request() req,
    @Query('teamId') teamId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsSnapshotsService.getOverview(
      { teamId, userId, dateRange: { startDate, endDate } },
      req.user.sub,
    );
  }

  /** GET /analytics-snapshots/teams/:teamId */
  @AnalyticsThrottle()
  @Get('teams/:teamId')
  getTeamSnapshot(@Param('teamId') teamId: string) {
    return this.analyticsSnapshotsService.getTeamSnapshot(teamId);
  }

  /** GET /analytics-snapshots/company/:companyId */
  @AnalyticsThrottle()
  @Get('company/:companyId')
  getCompanySnapshot(@Param('companyId') companyId: string) {
    return this.analyticsSnapshotsService.getCompanySnapshot(companyId);
  }
}
