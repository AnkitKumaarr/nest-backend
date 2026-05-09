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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ListProjectsDto } from './dto/project.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('projects')
@UseGuards(CustomAuthGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  private getCompanyId(req: any): string { return req.user.companyId; }
  private getUserName(req: any): string {
    return req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName ?? ''}`.trim()
      : req.user.email;
  }

  /** GET /api/v1/projects */
  @Get()
  list(@Query() dto: ListProjectsDto, @Request() req) {
    return this.service.list(dto, this.getCompanyId(req));
  }

  /** POST /api/v1/projects */
  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req), req.user.sub, this.getUserName(req));
  }

  /** PATCH /api/v1/projects/:projectId */
  @Patch(':projectId')
  update(@Param('projectId') projectId: string, @Body() dto: UpdateProjectDto) {
    return this.service.update({ ...dto, id: projectId });
  }

  /** DELETE /api/v1/projects/:projectId */
  @Delete(':projectId')
  remove(@Param('projectId') projectId: string) {
    return this.service.remove(projectId);
  }
}
