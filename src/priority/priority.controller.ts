import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { CreatePriorityDto, UpdatePriorityDto } from './dto/create-priority.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('priority')
@UseGuards(CustomAuthGuard)
export class PriorityController {
  constructor(private readonly service: PriorityService) {}

  @Post()
  create(@Body() dto: CreatePriorityDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put()
  update(@Body() dto: UpdatePriorityDto) {
    return this.service.update(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
