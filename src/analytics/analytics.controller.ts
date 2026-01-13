import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/analytics')
@UseGuards(CustomAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getDashboardSummary(
      req.user.sub,
      req.user.role,
      from,
      to,
    );
  }

  @Get('tasks')
  getTasks(@Request() req) {
    return this.analyticsService.getTaskAnalytics(req.user.sub, req.user.role);
  }

  @Get('meetings')
  getMeetings(@Request() req) {
    return this.analyticsService.getMeetingAnalytics(
      req.user.sub,
      req.user.role,
    );
  }

  // Admin-only: View a list of all users and their basic activity counts
  @Get('admin/user-activity')
  @Roles('admin')
  async getUserActivity() {
    // This is an example of an endpoint ONLY an admin can hit
    return { message: 'Detailed user activity logs for admin eyes only.' };
  }
}
