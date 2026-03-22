import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WeeklyTasksService } from './weekly-tasks.service';
import { CreateWeeklyTaskDto } from './dto/create-weekly-task.dto';
import { UpdateWeeklyTaskDto } from './dto/update-weekly-task.dto';
import { ListWeeklyTaskDto } from './dto/list-weekly-task.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('weekly-tasks')
@UseGuards(CustomAuthGuard)
export class WeeklyTasksController {
  constructor(private readonly service: WeeklyTasksService) {}

  private getCompanyId(req: any): string | undefined {
    return req.user.companyId ?? undefined;
  }

  @Post()
  create(@Body() dto: CreateWeeklyTaskDto, @Request() req) {
    return this.service.create(dto, req.user.sub, this.getCompanyId(req));
  }

  // POST used instead of GET to support body payload with filters + pagination
  @Post('list')
  findAll(@Body() dto: ListWeeklyTaskDto, @Request() req) {
    return this.service.findAll(dto, req.user.sub, this.getCompanyId(req));
  }

  @Get(':taskId')
  findOne(@Param('taskId') taskId: string, @Request() req) {
    return this.service.findOne(taskId, req.user.sub, this.getCompanyId(req));
  }

  @Put()
  update(@Body() dto: UpdateWeeklyTaskDto, @Request() req) {
    return this.service.update(dto, req.user.sub);
  }

  @Delete(':taskId')
  remove(@Param('taskId') taskId: string, @Request() req) {
    return this.service.remove(taskId, req.user.sub);
  }
}
