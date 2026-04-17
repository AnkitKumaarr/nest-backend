# Desk Component Data Structure

This document describes the data structure required for all cards in the Desk component.

## Overview

The Desk component displays 6 cards organized in a 3-row grid layout:
- Row 1: NextMeetingCard, TodaySummaryCard
- Row 2: UpcomingMeetings, PendingActionsCard
- Row 3: StreakCard, Achievements

## Card Data Structures

### 1. NextMeetingCard

**Props:**
- `nextMeeting: Meeting | null`
- `onJoin: (meetingId: string) => void`
- `onReschedule: (meetingId: string) => void`
- `onCancel: (meetingId: string) => void`

**Meeting Type:**
```typescript
interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Canceled';
  isRecurring: boolean;
  meetingLink: string;
  createdBy: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  participants: Participant[];
}
```

**Participant Type:**
```typescript
interface Participant {
  id: string;
  name: string;
  email?: string;
  initials?: string;
}
```

---

### 2. TodaySummaryCard

**Props:**
- `summary: TodaySummary | undefined`

**TodaySummary Type:**
```typescript
interface TodaySummary {
  totalMeetings: number;
  totalHours: number;
  totalMinutes: number;
  longestMeeting: {
    title: string;
    duration: number; // in minutes
  };
  freeTimeRemaining: number; // in minutes
  firstMeetingTime: string; // ISO datetime string
  lastMeetingTime: string; // ISO datetime string
  productivityScore?: number; // 0-100
}
```

---

### 3. UpcomingMeetings

**Props:**
- `meetings: Meeting[]`
- `nextMeetingId?: string` // Used to filter out the next meeting from the list

**Meeting Type:** Same as NextMeetingCard

**Note:** Displays up to 3 meetings excluding the next meeting.

---

### 4. PendingActionsCard

**Props:**
- `actions: PendingActions | undefined`

**PendingActions Type:**
```typescript
interface PendingActions {
  meetingsWithoutNotes: number;
  unconfirmedInvites: number;
  followUpsRequired: number;
  actionItemsPending: number;
  totalPending: number;
}
```

**Action Items Displayed:**
- Meetings without notes (orange icon)
- Unconfirmed invites (blue icon)
- Follow-ups required (green icon)
- Action items pending (red icon)

Only items with count > 0 are displayed.

---

### 5. StreakCard

**Props:**
- `streak: MeetingStreak | undefined`

**MeetingStreak Type:**
```typescript
interface MeetingStreak {
  current: number;
  longest: number;
  type: 'attendance' | 'participation' | 'consistency';
}
```

**Note:** Returns null if streak data is undefined.

---

### 6. Achievements

**Props:**
- `badges: MeetingBadge[]`
- `streak: MeetingStreak | undefined`

**MeetingBadge Type:**
```typescript
interface MeetingBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  earned: boolean;
  earnedAt?: string; // ISO datetime string
}
```

**MeetingStreak Type:** Same as StreakCard

**Note:** Only displays badges where `earned: true`.

---

## API Integration

Currently, the Desk component uses:
- `useGetNextMeetingQuery()` - Fetches the next meeting data
- Dummy data for other components (to be replaced with `/meetings/next` API in future)

**Expected API Response Structure:**
```typescript
interface DeskApiResponse {
  nextMeeting: Meeting;
  todaySummary: TodaySummary;
  pendingActions: PendingActions;
  streak: MeetingStreak;
  badges: MeetingBadge[];
  upcomingMeetings: Meeting[];
}
```

---

## Loading States

Each card has its own loading state handling:
- **NextMeetingCard**: Shows empty state if `nextMeeting` is null
- **TodaySummaryCard**: Shows "Loading summary..." if `summary` is undefined
- **UpcomingMeetings**: Shows empty state if no meetings
- **PendingActionsCard**: Shows "Loading actions..." if `actions` is undefined
- **StreakCard**: Returns null if `streak` is undefined
- **Achievements**: Shows empty state if no earned badges

The main Desk component uses a skeleton loader (`DeskSkeleton`) when the initial data is loading.
