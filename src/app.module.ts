import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EventsModule } from './gateways/events.module';
import { MailModule } from './mail/mail.module';
import { CompaniesModule } from './companies/companies.module';
import { CompanyUsersModule } from './company-users/company-users.module';
import { RolesModule } from './roles/roles.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectTasksModule } from './project-tasks/project-tasks.module';
import { WeeksModule } from './weeks/weeks.module';
import { WeeklyTasksModule } from './weekly-tasks/weekly-tasks.module';
import { LeaderModule } from './leader/leader.module';

@Module({
  imports: [
    EventsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
    MeetingsModule,
    AnalyticsModule,
    ActivityLogsModule,
    OrganizationsModule,
    MailModule,
    // ── TaskForge Modules ──────────────────────────
    CompaniesModule,
    CompanyUsersModule,
    RolesModule,
    TeamsModule,
    ProjectTasksModule,
    WeeksModule,
    WeeklyTasksModule,
    LeaderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
