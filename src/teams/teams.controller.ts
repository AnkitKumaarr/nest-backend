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

@Controller('teams')
@UseGuards(CustomAuthGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  private getCompanyId(req: any): string { return req.user.companyId; }

  /** GET /api/v1/teams */
  @Get()
  listTeams(@Query() dto: ListTeamsDto, @Request() req) {
    return this.service.listTeams(this.getCompanyId(req), req.user.sub, dto.page ?? 1, dto.limit ?? 25, dto.teamId, dto.filters);
  }

  /** POST /api/v1/teams */
  @Post()
  create(@Body() dto: CreateTeamDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req));
  }

  /** GET /api/v1/teams/:teamId */
  @Get(':teamId')
  findOne(@Param('teamId') teamId: string, @Request() req) {
    return this.service.findOne(teamId, this.getCompanyId(req));
  }

  /** GET /api/v1/teams/:teamId/insights */
  @Get(':teamId/insights')
  getInsights(@Param('teamId') teamId: string, @Request() req) {
    return this.service.findOne(teamId, this.getCompanyId(req));
  }

  /** PATCH /api/v1/teams/:teamId */
  @Patch(':teamId')
  update(@Param('teamId') teamId: string, @Body() dto: UpdateTeamDto, @Request() req) {
    return this.service.update(teamId, dto, this.getCompanyId(req));
  }

  /** DELETE /api/v1/teams/:teamId */
  @Delete(':teamId')
  remove(@Param('teamId') teamId: string, @Request() req) {
    return this.service.remove(teamId, this.getCompanyId(req));
  }
}
