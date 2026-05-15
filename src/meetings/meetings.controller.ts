import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ListMeetingsDto } from './dto/list-meetings.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import {
  ReadThrottle,
  WriteThrottle,
  AnalyticsThrottle,
} from '../common/decorators/throttle.decorator';

@Controller('meetings')
@UseGuards(CustomAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /** GET /api/v1/meetings */
  @ReadThrottle()
  @Get()
  listMeetings(@Query() dto: ListMeetingsDto, @Request() req) {
    return this.meetingsService.listMeetings(dto, req.user.sub);
  }

  /** GET /api/v1/meetings/dashboard — aggregated, expensive query */
  @AnalyticsThrottle()
  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.meetingsService.getDashboard(req.user.sub, req.user.companyId);
  }

  /** GET /api/v1/meetings/:meetingId */
  @ReadThrottle()
  @Get(':meetingId')
  findOne(@Param('meetingId') meetingId: string, @Request() req) {
    return this.meetingsService.findOne(meetingId, req.user.sub);
  }

  /** POST /api/v1/meetings */
  @WriteThrottle()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMeetingDto, @Request() req) {
    return this.meetingsService.create(dto, req.user.sub, req.user.companyId);
  }

  /** PATCH /api/v1/meetings/:meetingId */
  @WriteThrottle()
  @Patch(':meetingId')
  update(@Param('meetingId') meetingId: string, @Body() dto: UpdateMeetingDto, @Request() req) {
    return this.meetingsService.update(meetingId, dto, req.user.sub);
  }

  /** PATCH /api/v1/meetings/:meetingId/cancel */
  @WriteThrottle()
  @Patch(':meetingId/cancel')
  cancel(@Param('meetingId') meetingId: string, @Body() dto: CancelMeetingDto, @Request() req) {
    return this.meetingsService.cancel(meetingId, dto, req.user.sub);
  }

  /** DELETE /api/v1/meetings/:meetingId */
  @WriteThrottle()
  @Delete(':meetingId')
  @HttpCode(HttpStatus.OK)
  remove(@Param('meetingId') meetingId: string, @Request() req) {
    return this.meetingsService.remove(meetingId, req.user.sub);
  }
}
