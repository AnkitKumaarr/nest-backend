export interface Participant {
  id: string;
  name: string;
  email?: string;
  initials?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Canceled';
  isRecurring: boolean;
  meetingLink: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
}

export interface TodaySummary {
  totalMeetings: number;
  totalHours: number;
  totalMinutes: number;
  longestMeeting: {
    title: string;
    duration: number;
  };
  freeTimeRemaining: number;
  firstMeetingTime: string;
  lastMeetingTime: string;
  productivityScore?: number;
}

export interface PendingActions {
  meetingsWithoutNotes: number;
  unconfirmedInvites: number;
  followUpsRequired: number;
  actionItemsPending: number;
  totalPending: number;
}

export interface MeetingStreak {
  current: number;
  longest: number;
  type: 'attendance' | 'participation' | 'consistency';
}

export interface MeetingBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface MeetingOverviewResponse {
  nextMeeting: Meeting | null;
  todaySummary: TodaySummary;
  pendingActions: PendingActions;
  streak: MeetingStreak;
  badges: MeetingBadge[];
  upcomingMeetings: Meeting[];
}
