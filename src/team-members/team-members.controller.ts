import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { AddTeamMembersDto, ListTeamMembersDto } from './dto/team-member.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
// import { PermissionsGuard } from '../common/guards/permissions.guard';
// import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('team-members')
@UseGuards(CustomAuthGuard)
export class TeamMembersController {
  constructor(private readonly service: TeamMembersService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId;
  }

  @Post()
  // @UseGuards(PermissionsGuard)
  // @Permissions('team:manage-members')
  addMembers(@Body() dto: AddTeamMembersDto, @Request() req) {
    return this.service.addMembers(dto, this.getCompanyId(req));
  }

  @Post('list')
  listMembers(@Body() dto: ListTeamMembersDto, @Request() req) {
    return this.service.listMembers(dto, this.getCompanyId(req), req.user.sub);
  }

  @Delete(':id')
  // @UseGuards(PermissionsGuard)
  // @Permissions('team:manage-members')
  removeMember(@Param('id') id: string, @Request() req) {
    return this.service.removeMember(id, this.getCompanyId(req));
  }
}
