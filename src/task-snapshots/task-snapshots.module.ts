import { Module } from '@nestjs/common';
import { TaskSnapshotsService } from './task-snapshots.service';
import { TaskSnapshotsController } from './task-snapshots.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [TaskSnapshotsController],
  providers: [TaskSnapshotsService, PrismaService, JwtService],
  exports: [TaskSnapshotsService],
})
export class TaskSnapshotsModule {}
