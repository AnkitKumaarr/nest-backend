import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { TaskSnapshotsService } from './task-snapshots.service';
import { GetVisualDto } from './dto/get-visual.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('task-snapshots')
@UseGuards(CustomAuthGuard)
export class TaskSnapshotsController {
  constructor(private readonly taskSnapshotsService: TaskSnapshotsService) {}

  // ─── Individual ───────────────────────────────────────────────────────────

  @Get('status')
  getIndividualTaskStatus(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getIndividualVisual('task_status', req.user.sub, dto);
  }

  @Get('priority')
  getIndividualPriority(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getIndividualVisual('priority', req.user.sub, dto);
  }

  @Get('completion-trend')
  getIndividualCompletionTrend(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getIndividualVisual('completion_trend', req.user.sub, dto);
  }

  @Get('overdue')
  getIndividualOverdue(@Request() req, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getIndividualVisual('overdue', req.user.sub, dto);
  }

  // ─── Team ─────────────────────────────────────────────────────────────────

  @Get('team/:teamId/status')
  getTeamTaskStatus(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('task_status', teamId, dto);
  }

  @Get('team/:teamId/priority')
  getTeamPriority(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('priority', teamId, dto);
  }

  @Get('team/:teamId/workload')
  getTeamWorkload(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('workload', teamId, dto);
  }

  @Get('team/:teamId/completion-trend')
  getTeamCompletionTrend(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('completion_trend', teamId, dto);
  }

  @Get('team/:teamId/overdue')
  getTeamOverdue(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('overdue', teamId, dto);
  }

  @Get('team/:teamId/productivity')
  getTeamProductivity(@Param('teamId') teamId: string, @Query() dto: GetVisualDto) {
    return this.taskSnapshotsService.getTeamVisual('productivity', teamId, dto);
  }
}
