import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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

  @Post()
  create(@Body() dto: CreateRoleDto, @Request() req) {
    return this.service.create(dto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.companyId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateRoleDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.companyId);
  }
}
