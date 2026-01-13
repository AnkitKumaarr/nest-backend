import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EventsModule } from './gateways/events.module';

@Module({
  imports: [
    EventsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    NotificationsModule,
    MeetingsModule,
    AnalyticsModule,
    ActivityLogsModule,
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
