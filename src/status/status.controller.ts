import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('status')
@UseGuards(CustomAuthGuard)
export class StatusController {
  constructor(private readonly service: StatusService) {}

  @Post()
  create(@Body() dto: CreateStatusDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put()
  update(@Body() dto: UpdateStatusDto) {
    return this.service.update(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
