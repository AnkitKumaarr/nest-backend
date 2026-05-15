import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { ReadThrottle, WriteThrottle } from '../common/decorators/throttle.decorator';

@Controller('notifications')
@UseGuards(CustomAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/v1/notifications */
  @ReadThrottle()
  @Get()
  findAll(@Query() dto: ListNotificationsDto, @Request() req) {
    return this.notificationsService.findAll(req.user.sub, dto);
  }

  /** PATCH /api/v1/notifications/read-all */
  @WriteThrottle()
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  /** DELETE /api/v1/notifications */
  @WriteThrottle()
  @Delete()
  @HttpCode(HttpStatus.OK)
  removeAll(@Request() req) {
    return this.notificationsService.removeAll(req.user.sub);
  }

  /** PATCH /api/v1/notifications/:id/read */
  @WriteThrottle()
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  /** PATCH /api/v1/notifications/:id/unread */
  @WriteThrottle()
  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsUnread(id, req.user.sub);
  }

  /** DELETE /api/v1/notifications/:id */
  @WriteThrottle()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.sub);
  }
}
