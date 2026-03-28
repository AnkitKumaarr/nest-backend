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
import { DateRangeDto, ParticipationTrendDto } from './dto/date-range.dto';

@Controller('api/meetings')
@UseGuards(CustomAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  // ── Overview Tab ─────────────────────────────────────────────────────────────

  /** GET /api/meetings/analytics — four summary cards */
  @Get('analytics')
  getAnalytics(@Request() req) {
    return this.meetingsService.getAnalytics(req.user.sub);
  }

  /** GET /api/meetings/analytics/per-day — bar chart */
  @Get('analytics/per-day')
  getPerDay(@Query() dto: DateRangeDto, @Request() req) {
    return this.meetingsService.getPerDay(dto, req.user.sub);
  }

  /** GET /api/meetings/analytics/duration — pie chart */
  @Get('analytics/duration')
  getDurationDistribution(@Query() dto: DateRangeDto, @Request() req) {
    return this.meetingsService.getDurationDistribution(dto, req.user.sub);
  }

  /** GET /api/meetings/analytics/participation-trend — line chart */
  @Get('analytics/participation-trend')
  getParticipationTrend(@Query() dto: ParticipationTrendDto, @Request() req) {
    return this.meetingsService.getParticipationTrend(dto, req.user.sub);
  }

  /** GET /api/meetings/next — next upcoming meeting + countdown data */
  @Get('next')
  getNextMeeting(@Request() req) {
    return this.meetingsService.getNextMeeting(req.user.sub);
  }

  /** GET /api/meetings/streak — current and longest attendance streak */
  @Get('streak')
  getStreak(@Request() req) {
    return this.meetingsService.getStreak(req.user.sub);
  }

  /** GET /api/meetings/badges — earned achievement badges */
  @Get('badges')
  getBadges(@Request() req) {
    return this.meetingsService.getBadges(req.user.sub);
  }

  // ── List Tab ─────────────────────────────────────────────────────────────────

  /** GET /api/meetings — paginated meetings table with filters */
  @Get()
  listMeetings(@Query() dto: ListMeetingsDto, @Request() req) {
    return this.meetingsService.listMeetings(dto, req.user.sub);
  }

  /** POST /api/meetings — create a new meeting */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMeetingDto, @Request() req) {
    return this.meetingsService.create(dto, req.user.sub, req.user.companyId);
  }

  /** PATCH /api/meetings/:id — edit an existing meeting */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto, @Request() req) {
    return this.meetingsService.update(id, dto, req.user.sub);
  }

  /** PATCH /api/meetings/:id/cancel — cancel a meeting */
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelMeetingDto, @Request() req) {
    return this.meetingsService.cancel(id, dto, req.user.sub);
  }

  /** DELETE /api/meetings/:id — permanently delete a meeting */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req) {
    return this.meetingsService.remove(id, req.user.sub);
  }
}
