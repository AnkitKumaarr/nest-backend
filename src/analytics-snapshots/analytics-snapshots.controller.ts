import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AnalyticsSnapshotsService } from './analytics-snapshots.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('analytics-snapshots')
@UseGuards(CustomAuthGuard)
export class AnalyticsSnapshotsController {
  constructor(private readonly analyticsSnapshotsService: AnalyticsSnapshotsService) {}

  /** GET /analytics-snapshots — personal snapshot */
  @Get()
  getMySnapshot(@Request() req) {
    return this.analyticsSnapshotsService.getUserSnapshot(req.user.sub);
  }

  /** GET /analytics-snapshots/overview?teamId=&userId=&startDate=&endDate= */
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

  /** GET /analytics-snapshots/teams/:teamId — team analytics */
  @Get('teams/:teamId')
  getTeamSnapshot(@Param('teamId') teamId: string) {
    return this.analyticsSnapshotsService.getTeamSnapshot(teamId);
  }

  /** GET /analytics-snapshots/company/:companyId */
  @Get('company/:companyId')
  getCompanySnapshot(@Param('companyId') companyId: string) {
    return this.analyticsSnapshotsService.getCompanySnapshot(companyId);
  }
}
