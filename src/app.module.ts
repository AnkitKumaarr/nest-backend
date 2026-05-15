import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeetingsModule } from './meetings/meetings.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { EventsModule } from './gateways/events.module';
import { MailModule } from './mail/mail.module';
import { CompaniesModule } from './companies/companies.module';
import { CompanyUsersModule } from './company-users/company-users.module';
import { RolesModule } from './roles/roles.module';
import { TeamsModule } from './teams/teams.module';
import { TeamMembersModule } from './team-members/team-members.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { ProjectTasksModule } from './project-tasks/project-tasks.module';
import { WeeksModule } from './weeks/weeks.module';
import { WeeklyTasksModule } from './weekly-tasks/weekly-tasks.module';
import { TaskPriorityModule } from './task-priority/task-priority.module';
import { TaskStatusModule } from './task-status/task-status.module';
import { TaskSnapshotsModule } from './task-snapshots/task-snapshots.module';
import { MeetingSnapshotsModule } from './meeting-snapshots/meeting-snapshots.module';
import { AnalyticsSnapshotsModule } from './analytics-snapshots/analytics-snapshots.module';
import { SettingsModule } from './settings/settings.module';
import { FileManagerModule } from './file-manager/file-manager.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      // Only the global fallback is registered here.
      // Named tiers (login, write, read, …) are applied per-route via
      // @Throttle() decorators and carry their own inline limits.
      // Registering them globally would cause the guard to check ALL tiers on
      // every undecorated route — which breaks @SkipThrottle() on things like
      // GET /auth/me (it only skips 'default', leaving 10 other buckets active).
      { name: 'default', ttl: 60000, limit: 100 }, // 100 req/min/IP — global safety net
    ]),
    EventsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
    MeetingsModule,
    ActivityLogsModule,
    MailModule,
    // ── TaskForge Modules ──────────────────────────
    CompaniesModule,
    CompanyUsersModule,
    RolesModule,
    TeamsModule,
    TeamMembersModule,
    ProjectsModule,
    CommentsModule,
    ProjectTasksModule,
    WeeksModule,
    WeeklyTasksModule,
    TaskPriorityModule,
    TaskStatusModule,
    TaskSnapshotsModule,
    MeetingSnapshotsModule,
    AnalyticsSnapshotsModule,
    SettingsModule,
    FileManagerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
