import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsSnapshotsModule } from '../analytics-snapshots/analytics-snapshots.module';

@Module({
  imports: [PrismaModule, AnalyticsSnapshotsModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
