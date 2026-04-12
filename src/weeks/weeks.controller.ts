import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { CreateWeekDto } from './dto/create-week.dto';
import { UpdateWeekDto } from './dto/update-week.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('weeks')
@UseGuards(CustomAuthGuard)
export class WeeksController {
  constructor(private readonly service: WeeksService) {}

  @Post()
  create(@Body() dto: CreateWeekDto, @Request() req) {
    const companyId = req.user.companyId ?? null;
    return this.service.create(dto, req.user.sub, companyId);
  }

  @Get()
  findAll(@Request() req) {
    const companyId = req.user.companyId ?? null;
    const currentYear = new Date().getFullYear();
    return this.service.findAll(req.user.sub, companyId, currentYear);
  }

  @Put()
  update(@Body() dto: UpdateWeekDto, @Request() req) {
    return this.service.update(dto, req.user.sub);
  }
}
