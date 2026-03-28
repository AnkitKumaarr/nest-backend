import { Module } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskVisualsModule } from '../task-visuals/task-visuals.module';
import { AnalyticsSnapshotModule } from '../analytics-snapshot/analytics-snapshot.module';

@Module({
  imports: [PrismaModule, TaskVisualsModule, AnalyticsSnapshotModule],
  controllers: [ProjectTasksController],
  providers: [ProjectTasksService],
  exports: [ProjectTasksService],
})
export class ProjectTasksModule {}
