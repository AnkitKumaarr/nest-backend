import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto } from './dto/create-column.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('columns')
@UseGuards(CustomAuthGuard)
export class ColumnsController {
  constructor(private readonly service: ColumnsService) {}

  @Post()
  create(@Body() dto: CreateColumnDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put()
  update(@Body() dto: UpdateColumnDto) {
    return this.service.update(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
