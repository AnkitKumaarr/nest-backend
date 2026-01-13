import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('api/organizations')
@UseGuards(CustomAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  async create(@Body('name') name: string, @Request() req) {
    return this.orgService.create(name, req.user.sub);
  }

  @Get('me')
  async getMyOrg(@Request() req) {
    return this.orgService.getMyOrganization(req.user.orgId);
  }
}