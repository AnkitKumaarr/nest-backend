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
import { TeamMembersService } from './team-members.service';
import { AddTeamMembersDto, ListTeamMembersDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('team-members')
@UseGuards(CustomAuthGuard)
export class TeamMembersController {
  constructor(private readonly service: TeamMembersService) {}

  private getCompanyId(req: any): string { return req.user.companyId; }

  /** GET /api/v1/team-members */
  @ReadThrottle()
  @Get()
  listMembers(@Query() dto: ListTeamMembersDto, @Request() req) {
    return this.service.listMembers(dto, this.getCompanyId(req), req.user.sub);
  }

  /** POST /api/v1/team-members */
  @WriteThrottle()
  @Post()
  addMembers(@Body() dto: AddTeamMembersDto, @Request() req) {
    return this.service.addMembers(dto, this.getCompanyId(req));
  }

  /** PATCH /api/v1/team-members/update */
  @WriteThrottle()
  @Patch('update')
  updateMember(@Body() dto: UpdateTeamMemberDto, @Request() req) {
    return this.service.updateMember(dto, this.getCompanyId(req));
  }

  /** DELETE /api/v1/team-members/:memberId */
  @WriteThrottle()
  @Delete(':memberId')
  removeMember(@Param('memberId') memberId: string, @Request() req) {
    return this.service.removeMember(memberId, this.getCompanyId(req));
  }
}
