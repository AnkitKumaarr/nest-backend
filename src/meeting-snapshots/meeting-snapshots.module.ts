import { Module } from '@nestjs/common';
import { MeetingSnapshotsService } from './meeting-snapshots.service';
import { MeetingSnapshotsController } from './meeting-snapshots.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [MeetingSnapshotsController],
  providers: [MeetingSnapshotsService, PrismaService, JwtService],
  exports: [MeetingSnapshotsService],
})
export class MeetingSnapshotsModule {}
