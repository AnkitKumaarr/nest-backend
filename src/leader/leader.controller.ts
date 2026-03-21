import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LeaderService } from './leader.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller()
@UseGuards(CustomAuthGuard)
export class LeaderController {
  constructor(private readonly service: LeaderService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId ?? req.user.orgId;
  }

  // Technical Leader: My teams
  @Get('leader/teams')
  getLeaderTeams(@Request() req) {
    return this.service.getLeaderTeams(req.user.sub, this.getCompanyId(req));
  }

  // Technical Leader: Tasks of my teams + progress stats
  @Get('leader/tasks')
  getLeaderTasks(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getLeaderTasks(
      req.user.sub,
      this.getCompanyId(req),
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // Technical Leader: Insights
  @Get('leader/insights')
  getLeaderInsights(@Request() req) {
    return this.service.getLeaderInsights(
      req.user.sub,
      this.getCompanyId(req),
    );
  }

  // Team insights
  @Get('teams/:id/insights')
  async getTeamInsights(@Param('id') id: string, @Request() req) {
    const insights = await this.service.getTeamInsights(
      id,
      this.getCompanyId(req),
    );
    if (!insights) throw new NotFoundException('Team not found');
    return insights;
  }
}
