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

@Controller('api/notifications')
@UseGuards(CustomAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/notifications?page=1&limit=25&type=tasks&read=false */
  @Get()
  findAll(@Query() dto: ListNotificationsDto, @Request() req) {
    return this.notificationsService.findAll(req.user.sub, dto);
  }

  /** PATCH /api/notifications/read-all — mark every notification as read */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  /** DELETE /api/notifications — delete all notifications for the user */
  @Delete()
  @HttpCode(HttpStatus.OK)
  removeAll(@Request() req) {
    return this.notificationsService.removeAll(req.user.sub);
  }

  /** PATCH /api/notifications/:id/read — mark one as read */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  /** PATCH /api/notifications/:id/unread — mark one as unread */
  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsUnread(id, req.user.sub);
  }

  /** DELETE /api/notifications/:id — delete one notification */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.sub);
  }
}
