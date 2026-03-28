import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamSnapshotModule } from '../team-snapshot/team-snapshot.module';

@Module({
  imports: [PrismaModule, TeamSnapshotModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
