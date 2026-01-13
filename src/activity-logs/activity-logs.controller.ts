import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/activity-logs')
@UseGuards(CustomAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly logsService: ActivityLogsService) {}

  @Get()
  getLogs(@Request() req) {
    return this.logsService.findAll(req.user.sub, req.user.role);
  }
}