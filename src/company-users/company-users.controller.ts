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
import { CompanyUsersService } from './company-users.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { SigninCompanyUserDto } from './dto/signin-company-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FilterCompanyUsersDto } from './dto/filter-company-users.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('company-users')
export class CompanyUsersController {
  constructor(private readonly service: CompanyUsersService) {}

  // Auth: Company user sign in (no guard needed)
  @Post('auth/signin')
  signin(@Body() dto: SigninCompanyUserDto) {
    return this.service.signin(dto.email, dto.password);
  }

  // Change password (requires company-user auth)
  @Post('auth/change-password')
  @UseGuards(CustomAuthGuard)
  changePassword(@Body() dto: ChangePasswordDto, @Request() req) {
    return this.service.changePassword(req.user.sub, dto.newPassword);
  }

  // Admin-only: Create user
  @Post()
  @UseGuards(CustomAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateCompanyUserDto, @Request() req) {
    return this.service.create(dto, req.user.companyId, req.user.sub, req.user.fullName);
  }

  // Admin-only: Regenerate temp password
  @Post(':id/regenerate-temp-password')
  @UseGuards(CustomAuthGuard, RolesGuard)
  @Roles('admin')
  regenerateTempPassword(@Param('id') id: string, @Request() req) {
    return this.service.regenerateTempPassword(id, req.user.companyId);
  }

  // List users (company scoped with team filter)
  @Post('list')
  @UseGuards(CustomAuthGuard)
  findAll(@Body() dto: FilterCompanyUsersDto) {
    return this.service.findAll(
      dto.companyId,
      dto.teamId,
      dto.page,
      dto.limit,
      dto.search,
    );
  }

  // Get single user
  @Get(':id')
  @UseGuards(CustomAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.service.findOne(id, companyId);
  }

  // Update user
  @Put(':id')
  @UseGuards(CustomAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyUserDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.companyId);
  }

  // Soft delete
  @Delete(':id')
  @UseGuards(CustomAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.companyId);
  }
}
