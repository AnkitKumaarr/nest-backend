import { Module } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectTasksController],
  providers: [ProjectTasksService],
  exports: [ProjectTasksService],
})
export class ProjectTasksModule {}
