import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsSnapshotsModule } from '../analytics-snapshots/analytics-snapshots.module';

@Module({
  imports: [PrismaModule, AnalyticsSnapshotsModule],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamMembersModule {}
