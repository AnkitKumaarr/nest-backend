import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
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

  private getCompanyId(req: any): string {
    return req.user.companyId;
  }

  private getUserName(req: any): string {
    return req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName ?? ''}`.trim()
      : req.user.email;
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.service.create(dto, this.getCompanyId(req), req.user.sub, this.getUserName(req));
  }

  @Post('list')
  list(@Body() dto: ListProjectsDto, @Request() req) {
    return this.service.list(dto, this.getCompanyId(req));
  }

  @Put()
  update(@Body() dto: UpdateProjectDto) {
    return this.service.update(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
