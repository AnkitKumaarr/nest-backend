import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('weeks')
@UseGuards(CustomAuthGuard)
export class WeeksController {
  constructor(private readonly service: WeeksService) {}

  /** GET /api/v1/weeks?year=2025 */
  @Get()
  findAll(@Query('year') year: string, @Request() req) {
    const companyId = req.user.companyId ?? null;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.service.findAll(req.user.sub, companyId, currentYear);
  }

  /** POST /api/v1/weeks */
  @Post()
  create(@Body() dto: CreateWeekDto, @Request() req) {
    return this.service.create(dto, req.user.sub, req.user.companyId ?? null);
  }

  /** GET /api/v1/weeks/:weekId */
  @Get(':weekId')
  findOne(@Param('weekId') weekId: string, @Request() req) {
    return this.service.findOne(weekId, req.user.sub);
  }

  /** PATCH /api/v1/weeks/:weekId */
  @Patch(':weekId')
  update(@Param('weekId') id: string, @Body() dto: UpdateWeekDto, @Request() req) {
    return this.service.update({ ...dto, id }, req.user.sub);
  }
}
