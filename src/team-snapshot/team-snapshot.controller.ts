import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TeamSnapshotService } from './team-snapshot.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('api/team-snapshot')
@UseGuards(CustomAuthGuard)
export class TeamSnapshotController {
  constructor(private readonly teamSnapshotService: TeamSnapshotService) {}

  // ── All charts in one request ────────────────────────────────────────────────

  /** GET /api/team-snapshot/team/:teamId — all six chart snapshots for a team */
  @Get('team/:teamId')
  getAllSnapshots(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getAllSnapshots(teamId);
  }

  // ── Individual chart endpoints ───────────────────────────────────────────────

  /** GET /api/team-snapshot/team/:teamId/member-count — total member count (stat card) */
  @Get('team/:teamId/member-count')
  getMemberCount(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('member_count', teamId);
  }

  /** GET /api/team-snapshot/team/:teamId/task-status — task status bar chart */
  @Get('team/:teamId/task-status')
  getTaskStatus(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('task_status', teamId);
  }

  /** GET /api/team-snapshot/team/:teamId/task-priority — task priority pie chart */
  @Get('team/:teamId/task-priority')
  getTaskPriority(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('task_priority', teamId);
  }

  /** GET /api/team-snapshot/team/:teamId/workload — open tasks per member bar chart */
  @Get('team/:teamId/workload')
  getWorkload(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('workload', teamId);
  }

  /** GET /api/team-snapshot/team/:teamId/completion-trend — completed tasks/day line chart */
  @Get('team/:teamId/completion-trend')
  getCompletionTrend(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('completion_trend', teamId);
  }

  /** GET /api/team-snapshot/team/:teamId/member-growth — members added/day line chart */
  @Get('team/:teamId/member-growth')
  getMemberGrowth(@Param('teamId') teamId: string) {
    return this.teamSnapshotService.getSnapshot('member_growth', teamId);
  }
}
