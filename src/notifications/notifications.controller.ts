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

@Controller('notifications')
@UseGuards(CustomAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/v1/notifications */
  @Get()
  findAll(@Query() dto: ListNotificationsDto, @Request() req) {
    return this.notificationsService.findAll(req.user.sub, dto);
  }

  /** PATCH /api/v1/notifications/read-all */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  /** DELETE /api/v1/notifications */
  @Delete()
  @HttpCode(HttpStatus.OK)
  removeAll(@Request() req) {
    return this.notificationsService.removeAll(req.user.sub);
  }

  /** PATCH /api/v1/notifications/:id/read */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  /** PATCH /api/v1/notifications/:id/unread */
  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsUnread(id, req.user.sub);
  }

  /** DELETE /api/v1/notifications/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.sub);
  }
}
