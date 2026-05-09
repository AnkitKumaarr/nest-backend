import { Module } from '@nestjs/common';
import { WeeklyTasksService } from './weekly-tasks.service';
import { WeeklyTasksController } from './weekly-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskSnapshotsModule } from '../task-snapshots/task-snapshots.module';
import { AnalyticsSnapshotsModule } from '../analytics-snapshots/analytics-snapshots.module';

@Module({
  imports: [PrismaModule, TaskSnapshotsModule, AnalyticsSnapshotsModule],
  controllers: [WeeklyTasksController],
  providers: [WeeklyTasksService],
})
export class WeeklyTasksModule {}
