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
      // ── Layer 1: Global fallback (all routes not explicitly decorated) ──────
      { name: 'default',          ttl: 60000,  limit: 100 }, // 100 req/min/IP

      // ── Layer 2: Auth — unauthenticated, IP-tracked ──────────────────────
      { name: 'login',            ttl: 60000,  limit: 5   }, // 5 req/min   — signin, google
      { name: 'register',         ttl: 600000, limit: 3   }, // 3 req/10min — signup
      { name: 'otp',              ttl: 300000, limit: 3   }, // 3 req/5min  — verify-email, resend-otp
      { name: 'forgotPassword',   ttl: 900000, limit: 3   }, // 3 req/15min — forgot-password
      { name: 'resetPassword',    ttl: 60000,  limit: 5   }, // 5 req/min   — reset-password

      // ── Layer 3: Authenticated — user-tracked ────────────────────────────
      { name: 'write',            ttl: 60000,  limit: 60  }, // 60 req/min  — mutations
      { name: 'read',             ttl: 60000,  limit: 300 }, // 300 req/min — reads
      { name: 'upload',           ttl: 60000,  limit: 10  }, // 10 req/min  — file uploads
      { name: 'analytics',        ttl: 60000,  limit: 30  }, // 30 req/min  — dashboards/aggregations
      { name: 'export',           ttl: 60000,  limit: 5   }, // 5 req/min   — invoice downloads
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
