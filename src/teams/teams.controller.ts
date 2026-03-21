import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('teams')
@UseGuards(CustomAuthGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId ?? req.user.orgId;
  }

  // ── Team CRUD ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateTeamDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req), req.user.sub);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      this.getCompanyId(req),
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.getCompanyId(req));
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: CreateTeamDto,
    @Request() req,
  ) {
    return this.service.update(id, dto.name, this.getCompanyId(req));
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, this.getCompanyId(req));
  }

  // ── Members ───────────────────────────────────────────────────────────────

  @Post(':id/members')
  @UseGuards(PermissionsGuard)
  @Permissions('team:manage-members')
  addMembers(
    @Param('id') id: string,
    @Body() dto: AddMembersDto,
    @Request() req,
  ) {
    return this.service.addMembers(id, dto.userIds, this.getCompanyId(req));
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req) {
    return this.service.getMembers(id, this.getCompanyId(req));
  }

  @Delete(':id/members/:userId')
  @UseGuards(PermissionsGuard)
  @Permissions('team:manage-members')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.service.removeMember(id, userId, this.getCompanyId(req));
  }
}
