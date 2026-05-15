import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ListTeamsDto } from './dto/list-teams.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import {
  ReadThrottle,
  WriteThrottle,
  AnalyticsThrottle,
} from '../common/decorators/throttle.decorator';

@Controller('teams')
@UseGuards(CustomAuthGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  private getCompanyId(req: any): string { return req.user.companyId; }

  /** GET /api/v1/teams */
  @ReadThrottle()
  @Get()
  listTeams(@Query() dto: ListTeamsDto, @Request() req) {
    return this.service.listTeams(this.getCompanyId(req), req.user.sub, dto.page ?? 1, dto.limit ?? 25, dto.teamId, dto.filters);
  }

  /** POST /api/v1/teams */
  @WriteThrottle()
  @Post()
  create(@Body() dto: CreateTeamDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req));
  }

  /** GET /api/v1/teams/:teamId */
  @ReadThrottle()
  @Get(':teamId')
  findOne(@Param('teamId') teamId: string, @Request() req) {
    return this.service.findOne(teamId, this.getCompanyId(req));
  }

  /** GET /api/v1/teams/:teamId/insights — aggregated performance data */
  @AnalyticsThrottle()
  @Get(':teamId/insights')
  getInsights(@Param('teamId') teamId: string, @Request() req) {
    return this.service.findOne(teamId, this.getCompanyId(req));
  }

  /** PATCH /api/v1/teams/:teamId */
  @WriteThrottle()
  @Patch(':teamId')
  update(@Param('teamId') teamId: string, @Body() dto: UpdateTeamDto, @Request() req) {
    return this.service.update(teamId, dto, this.getCompanyId(req));
  }

  /** DELETE /api/v1/teams/:teamId */
  @WriteThrottle()
  @Delete(':teamId')
  remove(@Param('teamId') teamId: string, @Request() req) {
    return this.service.remove(teamId, this.getCompanyId(req));
  }
}
