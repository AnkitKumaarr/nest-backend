import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { TaskVisualsService } from './task-visuals.service';
import { GetVisualDto } from './dto/get-visual.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('api/task-visuals')
@UseGuards(CustomAuthGuard)
export class TaskVisualsController {
  constructor(private readonly taskVisualsService: TaskVisualsService) {}

  // ─── Individual ───────────────────────────────────────────────────────────

  @Get('individual/task-status')
  getIndividualTaskStatus(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getIndividualVisual('task_status', req.user.sub, dto);
  }

  @Get('individual/priority')
  getIndividualPriority(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getIndividualVisual('priority', req.user.sub, dto);
  }

  @Get('individual/completion-trend')
  getIndividualCompletionTrend(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getIndividualVisual('completion_trend', req.user.sub, dto);
  }

  @Get('individual/overdue')
  getIndividualOverdue(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getIndividualVisual('overdue', req.user.sub, dto);
  }

  // ─── Team ─────────────────────────────────────────────────────────────────

  @Get('team/:teamId/task-status')
  getTeamTaskStatus(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('task_status', teamId, dto);
  }

  @Get('team/:teamId/priority')
  getTeamPriority(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('priority', teamId, dto);
  }

  @Get('team/:teamId/workload')
  getTeamWorkload(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('workload', teamId, dto);
  }

  @Get('team/:teamId/completion-trend')
  getTeamCompletionTrend(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('completion_trend', teamId, dto);
  }

  @Get('team/:teamId/overdue')
  getTeamOverdue(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('overdue', teamId, dto);
  }

  @Get('team/:teamId/productivity')
  getTeamProductivity(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskVisualsService.getTeamVisual('productivity', teamId, dto);
  }
}
