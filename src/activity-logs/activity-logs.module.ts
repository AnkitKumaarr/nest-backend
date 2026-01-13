import { Module, Global } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogController } from './activity-logs.controller';

@Global() // Make it global so you don't have to import it in Tasks/Meetings
@Module({
  providers: [ActivityLogsService],
  controllers: [ActivityLogController],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}