import { Module } from '@nestjs/common';
import { TaskPriorityService } from './task-priority.service';
import { TaskPriorityController } from './task-priority.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskPriorityController],
  providers: [TaskPriorityService],
})
export class TaskPriorityModule {}
