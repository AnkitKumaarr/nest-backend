import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
@UseGuards(CustomAuthGuard, RolesGuard)
@Roles('admin')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  /** GET /api/v1/roles */
  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.companyId);
  }

  /** POST /api/v1/roles */
  @Post()
  create(@Body() dto: CreateRoleDto, @Request() req) {
    return this.service.create(dto, req.user.companyId);
  }

  /** GET /api/v1/roles/:roleId */
  @Get(':roleId')
  findOne(@Param('roleId') roleId: string, @Request() req) {
    return this.service.findOne(roleId, req.user.companyId);
  }

  /** PATCH /api/v1/roles/:roleId */
  @Patch(':roleId')
  update(@Param('roleId') roleId: string, @Body() dto: CreateRoleDto, @Request() req) {
    return this.service.update(roleId, dto, req.user.companyId);
  }

  /** DELETE /api/v1/roles/:roleId */
  @Delete(':roleId')
  remove(@Param('roleId') roleId: string, @Request() req) {
    return this.service.remove(roleId, req.user.companyId);
  }
}
