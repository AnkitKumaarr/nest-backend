import { Module } from '@nestjs/common';
import { WeeklyTasksService } from './weekly-tasks.service';
import { WeeklyTasksController } from './weekly-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WeeklyTasksController],
  providers: [WeeklyTasksService],
})
export class WeeklyTasksModule {}
