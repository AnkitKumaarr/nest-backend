import { Module } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskSnapshotsModule } from '../task-snapshots/task-snapshots.module';
import { AnalyticsSnapshotsModule } from '../analytics-snapshots/analytics-snapshots.module';

@Module({
  imports: [PrismaModule, TaskSnapshotsModule, AnalyticsSnapshotsModule],
  controllers: [ProjectTasksController],
  providers: [ProjectTasksService],
  exports: [ProjectTasksService],
})
export class ProjectTasksModule {}
