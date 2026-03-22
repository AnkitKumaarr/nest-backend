import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { CreateWeekDto } from './dto/create-week.dto';
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
    return this.service.findAll(req.user.sub, companyId);
  }

  @Delete(':weekId')
  remove(@Param('weekId') weekId: string, @Request() req) {
    return this.service.remove(weekId, req.user.sub);
  }
}
