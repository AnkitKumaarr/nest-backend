import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ListTeamsDto } from './dto/list-teams.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teams')
@UseGuards(CustomAuthGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId;
  }

  // ── Team CRUD ─────────────────────────────────────────────────────────────

  @Post()
  // @UseGuards(RolesGuard)
  // @Roles('admin')
  create(@Body() dto: CreateTeamDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req));
  }

  @Post('list')
  listTeams(@Body() dto: ListTeamsDto, @Request() req) {
    return this.service.listTeams(
      this.getCompanyId(req),
      req.user.sub,
      dto.page ?? 1,
      dto.limit ?? 25,
      dto.teamId,
      dto.filters,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.getCompanyId(req));
  }

  @Put()
  // @UseGuards(RolesGuard)
  // @Roles('admin')
  update(@Body() dto: UpdateTeamDto, @Request() req) {
    return this.service.update(dto.id, dto.name, this.getCompanyId(req));
  }

  @Delete(':id')
  // @UseGuards(RolesGuard)
  // @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, this.getCompanyId(req));
  }
}
