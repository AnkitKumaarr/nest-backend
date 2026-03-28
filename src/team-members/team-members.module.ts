import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamSnapshotModule } from '../team-snapshot/team-snapshot.module';

@Module({
  imports: [PrismaModule, TeamSnapshotModule],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamMembersModule {}
