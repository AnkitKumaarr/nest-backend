import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TaskPriorityService } from './task-priority.service';
import { CreateTaskPriorityDto, UpdateTaskPriorityDto } from './dto/create-task-priority.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('priority')
@UseGuards(CustomAuthGuard)
export class TaskPriorityController {
  constructor(private readonly service: TaskPriorityService) {}

  /** GET /api/v1/priority */
  @ReadThrottle()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** POST /api/v1/priority */
  @WriteThrottle()
  @Post()
  create(@Body() dto: CreateTaskPriorityDto) {
    return this.service.create(dto);
  }

  /** GET /api/v1/priority/:priorityId */
  @ReadThrottle()
  @Get(':priorityId')
  findOne(@Param('priorityId') priorityId: string) {
    return this.service.findOne(priorityId);
  }

  /** PATCH /api/v1/priority/:priorityId */
  @WriteThrottle()
  @Patch(':priorityId')
  update(@Param('priorityId') priorityId: string, @Body() dto: UpdateTaskPriorityDto) {
    return this.service.update({ ...dto, id: priorityId });
  }

  /** DELETE /api/v1/priority/:priorityId */
  @WriteThrottle()
  @Delete(':priorityId')
  remove(@Param('priorityId') priorityId: string) {
    return this.service.remove(priorityId);
  }
}
