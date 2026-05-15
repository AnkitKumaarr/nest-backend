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
import { TaskStatusService } from './task-status.service';
import { CreateTaskStatusDto, UpdateTaskStatusDto } from './dto/create-task-status.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('status')
@UseGuards(CustomAuthGuard)
export class TaskStatusController {
  constructor(private readonly service: TaskStatusService) {}

  /** GET /api/v1/status */
  @ReadThrottle()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** POST /api/v1/status */
  @WriteThrottle()
  @Post()
  create(@Body() dto: CreateTaskStatusDto) {
    return this.service.create(dto);
  }

  /** GET /api/v1/status/:statusId */
  @ReadThrottle()
  @Get(':statusId')
  findOne(@Param('statusId') statusId: string) {
    return this.service.findOne(statusId);
  }

  /** PATCH /api/v1/status/:statusId */
  @WriteThrottle()
  @Patch(':statusId')
  update(@Param('statusId') statusId: string, @Body() dto: UpdateTaskStatusDto) {
    return this.service.update({ ...dto, id: statusId });
  }

  /** DELETE /api/v1/status/:statusId */
  @WriteThrottle()
  @Delete(':statusId')
  remove(@Param('statusId') statusId: string) {
    return this.service.remove(statusId);
  }
}
