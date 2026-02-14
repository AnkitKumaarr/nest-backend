import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('api/tasks')
@UseGuards(CustomAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(dto, req.user.sub, req.orgId);
  }

  @Get()
  getMyTasks(@Request() req) {
    return this.tasksService.getTasks(req.user.sub);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.findAll({ status, priority, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post('update')
  update(@Body() dto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(dto.taskId, dto, req.user.sub);
  }

  @Delete('delete/:taskId')
  remove(@Param('taskId') taskId: string, @Request() req) {
    return this.tasksService.remove(taskId, req.user.sub);
  }
}
