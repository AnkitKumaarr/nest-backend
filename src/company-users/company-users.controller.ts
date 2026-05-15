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
import { CompanyUsersService } from './company-users.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { FilterCompanyUsersDto } from './dto/filter-company-users.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('company-users')
@UseGuards(CustomAuthGuard)
export class CompanyUsersController {
  constructor(private readonly service: CompanyUsersService) {}

  /** GET /api/v1/company-users */
  @ReadThrottle()
  @Get()
  findAll(@Query() dto: FilterCompanyUsersDto, @Request() req) {
    return this.service.findAll(req.user.companyId, dto.teamId, dto.page, dto.limit, dto.search);
  }

  /** POST /api/v1/company-users — admin only */
  @WriteThrottle()
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateCompanyUserDto, @Request() req) {
    return this.service.create(dto, req.user.companyId, req.user.sub, req.user.fullName);
  }

  /** GET /api/v1/company-users/:id */
  @ReadThrottle()
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.companyId);
  }

  /** PATCH /api/v1/company-users/:id — admin only */
  @WriteThrottle()
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyUserDto, @Request() req) {
    return this.service.update(id, dto, req.user.companyId);
  }

  /** DELETE /api/v1/company-users/:id — admin only */
  @WriteThrottle()
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.companyId);
  }
}
