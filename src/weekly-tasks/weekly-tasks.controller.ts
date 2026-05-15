import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WeeklyTasksService } from './weekly-tasks.service';
import { CreateWeeklyTaskDto } from './dto/create-weekly-task.dto';
import { UpdateWeeklyTaskDto } from './dto/update-weekly-task.dto';
import { ListWeeklyTaskDto } from './dto/list-weekly-task.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('weekly-tasks')
@UseGuards(CustomAuthGuard)
export class WeeklyTasksController {
  constructor(private readonly service: WeeklyTasksService) {}

  private getCompanyId(req: any): string | undefined { return req.user.companyId ?? undefined; }

  /** GET /api/v1/weekly-tasks */
  @ReadThrottle()
  @Get()
  findAll(@Query() dto: ListWeeklyTaskDto, @Request() req) {
    return this.service.findAll(dto, req.user.sub, this.getCompanyId(req));
  }

  /** POST /api/v1/weekly-tasks */
  @WriteThrottle()
  @Post()
  create(@Body() dto: CreateWeeklyTaskDto, @Request() req) {
    return this.service.create(dto, req.user.sub, this.getCompanyId(req));
  }

  /** GET /api/v1/weekly-tasks/:weeklyTaskId */
  @ReadThrottle()
  @Get(':weeklyTaskId')
  findOne(@Param('weeklyTaskId') weeklyTaskId: string, @Request() req) {
    return this.service.findOne(weeklyTaskId, req.user.sub, this.getCompanyId(req));
  }

  /** PATCH /api/v1/weekly-tasks/:weeklyTaskId */
  @WriteThrottle()
  @Patch(':weeklyTaskId')
  update(@Param('weeklyTaskId') weeklyTaskId: string, @Body() dto: UpdateWeeklyTaskDto, @Request() req) {
    return this.service.update({ ...dto, id: weeklyTaskId }, req.user.sub);
  }

  /** DELETE /api/v1/weekly-tasks/:weeklyTaskId */
  @WriteThrottle()
  @Delete(':weeklyTaskId')
  remove(@Param('weeklyTaskId') weeklyTaskId: string, @Request() req) {
    return this.service.remove(weeklyTaskId, req.user.sub);
  }
}
