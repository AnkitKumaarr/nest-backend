import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('tasks')
@UseGuards(CustomAuthGuard)
export class ProjectTasksController {
  constructor(private readonly service: ProjectTasksService) {}

  private getCompanyId(req: any): string {
    return req.user.companyId ?? req.user.orgId;
  }

  private getPermissions(req: any): string[] {
    return req.user.permissions ?? [];
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('task:create')
  create(@Body() dto: CreateProjectTaskDto, @Request() req) {
    return this.service.create(dto, req.user.sub, this.getCompanyId(req));
  }

  @Get()
  findAll(
    @Request() req,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      this.getCompanyId(req),
      teamId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.getCompanyId(req));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectTaskDto>,
    @Request() req,
  ) {
    return this.service.update(
      id,
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

  // ── Comments ──────────────────────────────────────────────────────────────

  @Post(':taskId/comments')
  addComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const username =
      req.user.firstName
        ? `${req.user.firstName} ${req.user.lastName ?? ''}`.trim()
        : req.user.email;
    return this.service.addComment(
      taskId,
      dto.comment,
      req.user.sub,
      username,
      this.getCompanyId(req),
    );
  }

  @Get(':taskId/comments')
  getComments(
    @Param('taskId') taskId: string,
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getComments(
      taskId,
      this.getCompanyId(req),
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
