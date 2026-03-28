import { Module } from '@nestjs/common';
import { TaskVisualsService } from './task-visuals.service';
import { TaskVisualsController } from './task-visuals.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [TaskVisualsController],
  providers: [TaskVisualsService, PrismaService, JwtService],
  exports: [TaskVisualsService],
})
export class TaskVisualsModule {}
