import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('meetings')
@UseGuards(CustomAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post('create')
  create(@Body() dto: CreateMeetingDto, @Request() req) {
    return this.meetingsService.create(dto, req.user.sub, req.orgId);
  }

  // To maintain backward compatibility if any part of the frontend uses the root POST
  @Post()
  createRoot(@Body() dto: CreateMeetingDto, @Request() req) {
    return this.meetingsService.create(dto, req.user.sub, req.orgId);
  }

  @Get()
  findAll(@Request() req) {
    return this.meetingsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.meetingsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.meetingsService.remove(id, req.user.sub);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.meetingsService.joinMeeting(id, req.user.sub);
  }
}
