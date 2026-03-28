import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TeamSnapshotService } from './team-snapshot.service';
import { TeamSnapshotController } from './team-snapshot.controller';

@Module({
  controllers: [TeamSnapshotController],
  providers: [TeamSnapshotService, JwtService],
  exports: [TeamSnapshotService],
})
export class TeamSnapshotModule {}
