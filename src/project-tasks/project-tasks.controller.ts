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
import { ProjectTasksService } from './project-tasks.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('project-tasks')
@UseGuards(CustomAuthGuard)
export class ProjectTasksController {
  constructor(private readonly service: ProjectTasksService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId;
  }

  private getPermissions(req: any): string[] {
    return req.user.permissions ?? [];
  }

  @Post()
  // @UseGuards(PermissionsGuard)
  // @Permissions('task:create')
  create(@Body() dto: CreateProjectTaskDto, @Request() req) {
    return this.service.create(dto, req.user.sub, this.getCompanyId(req));
  }

  @Post('list')
  listTasks(@Body() dto: ListTasksDto, @Request() req) {
    return this.service.findAll(dto, this.getCompanyId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.getCompanyId(req));
  }

  @Put()
  update(@Body() dto: UpdateTaskDto, @Request() req) {
    return this.service.update(
      dto,
      req.user.sub,
      this.getCompanyId(req),
      this.getPermissions(req),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(
      id,
      req.user.sub,
      this.getCompanyId(req),
      this.getPermissions(req),
    );
  }
}
