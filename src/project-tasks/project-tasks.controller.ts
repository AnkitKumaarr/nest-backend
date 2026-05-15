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
import { ProjectTasksService } from './project-tasks.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ListProjectTasksDto } from './dto/list-project-tasks.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('project-tasks')
@UseGuards(CustomAuthGuard)
export class ProjectTasksController {
  constructor(private readonly service: ProjectTasksService) {}

  private getCompanyId(req: any): string { return req.user.companyId; }
  private getPermissions(req: any): string[] { return req.user.permissions ?? []; }

  /** GET /api/v1/project-tasks */
  @ReadThrottle()
  @Get()
  listTasks(@Query() dto: ListProjectTasksDto, @Request() req) {
    return this.service.findAll(dto, this.getCompanyId(req));
  }

  /** POST /api/v1/project-tasks */
  @WriteThrottle()
  @Post()
  create(@Body() dto: CreateProjectTaskDto, @Request() req) {
    return this.service.create(dto, req.user.sub, this.getCompanyId(req));
  }

  /** GET /api/v1/project-tasks/:taskId */
  @ReadThrottle()
  @Get(':taskId')
  findOne(@Param('taskId') taskId: string, @Request() req) {
    return this.service.findOne(taskId, this.getCompanyId(req));
  }

  /** PATCH /api/v1/project-tasks/:taskId */
  @WriteThrottle()
  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() dto: UpdateProjectTaskDto, @Request() req) {
    return this.service.update({ ...dto, taskId }, req.user.sub, this.getCompanyId(req), this.getPermissions(req));
  }

  /** DELETE /api/v1/project-tasks/:taskId */
  @WriteThrottle()
  @Delete(':taskId')
  remove(@Param('taskId') taskId: string, @Request() req) {
    return this.service.remove(taskId, req.user.sub, this.getCompanyId(req), this.getPermissions(req));
  }
}
