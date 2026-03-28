# Analytics Snapshot — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## Overview

The Analytics Snapshot API provides a **single rich document** that powers the detail-view panel on any dashboard.

Instead of fetching multiple charts separately, one snapshot call gives you:
- **KPI summary** — key numbers at a glance
- **Task breakdown** — project tasks by status, priority, resolution speed
- **Weekly task breakdown** — personal week planner stats
- **Meeting breakdown** — meeting hours, avg duration, upcoming count
- **30-day trends** — daily task completions and meeting frequency

Snapshots are **automatically refreshed** on every task or meeting mutation. No polling needed.

---

## How Snapshots Work

```
Any task or meeting is created / updated / deleted
        ↓ (automatic, background)
AnalyticsSnapshot recomputed and stored in analytics_snapshots collection
        ↓
GET /api/analytics-snapshot/* → returns stored snapshot instantly
```

---

## Endpoints

---

### 1. My Snapshot (User)

```
GET /api/analytics-snapshot/me
```

Full combined analytics for the **logged-in user** — project tasks + weekly tasks + meetings.

**Example response:**

```json
{
  "scope": "user",
  "scopeId": "65ffabc987654321abcd0001",
  "summary": {
    "totalProjectTasks": 43,
    "completedProjectTasks": 28,
    "overdueProjectTasks": 3,
    "inProgressProjectTasks": 8,
    "completionRate": 65,
    "overdueRate": 7,
    "recentlyCompletedLast7Days": 5,
    "totalWeeklyTasks": 12,
    "completedWeeklyTasks": 9,
    "totalMeetings": 15,
    "upcomingMeetings": 3,
    "meetingHoursTotal": 22.5,
    "avgMeetingDurationMinutes": 45,
    "productivityScore": 72
  },
  "taskBreakdown": {
    "byStatus": [
      { "status": "COMPLETED", "count": 28 },
      { "status": "IN_PROGRESS", "count": 8 },
      { "status": "TODO", "count": 4 },
      { "status": "OVERDUE", "count": 3 }
    ],
    "byPriority": [
      { "priority": "HIGH", "count": 10 },
      { "priority": "MEDIUM", "count": 25 },
      { "priority": "LOW", "count": 8 }
    ],
    "recentlyCompleted": 5,
    "avgResolutionDays": 3.2
  },
  "weeklyTaskBreakdown": {
    "byStatus": [
      { "status": "done", "count": 9 },
      { "status": "todo", "count": 3 }
    ],
    "byPriority": [
      { "priority": "high", "count": 4 },
      { "priority": "medium", "count": 8 }
    ],
    "totalThisWeek": 12,
    "completedThisWeek": 9
  },
  "meetingBreakdown": {
    "byStatus": [
      { "status": "completed", "count": 12 },
      { "status": "scheduled", "count": 3 }
    ],
    "avgDurationMinutes": 45,
    "totalHours": 22.5,
    "upcomingCount": 3,
    "participationRate": 100
  },
  "trends": {
    "taskCompletion": {
      "2026-03-22": 2,
      "2026-03-23": 5,
      "2026-03-24": 3,
      "2026-03-25": 6,
      "2026-03-26": 4
    },
    "meetingFrequency": {
      "2026-03-22": 1,
      "2026-03-24": 2,
      "2026-03-26": 3
    }
  },
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

---

### 2. Team Snapshot

```
GET /api/analytics-snapshot/team/:teamId
```

Full combined analytics for a **team** — project tasks + workload per member.

**Example response:**

```json
{
  "scope": "team",
  "scopeId": "660abcde987654321abc0002",
  "summary": {
    "totalProjectTasks": 120,
    "completedProjectTasks": 78,
    "overdueProjectTasks": 7,
    "inProgressProjectTasks": 24,
    "completionRate": 65,
    "overdueRate": 6,
    "recentlyCompletedLast7Days": 14,
    "productivityScore": 71
  },
  "taskBreakdown": {
    "byStatus": [
      { "status": "COMPLETED", "count": 78 },
      { "status": "IN_PROGRESS", "count": 24 },
      { "status": "TODO", "count": 11 },
      { "status": "OVERDUE", "count": 7 }
    ],
    "byPriority": [
      { "priority": "HIGH", "count": 35 },
      { "priority": "MEDIUM", "count": 65 },
      { "priority": "LOW", "count": 20 }
    ],
    "recentlyCompleted": 14,
    "avgResolutionDays": 4.1,
    "workloadPerMember": [
      { "name": "Rahul", "count": 35 },
      { "name": "Sneha", "count": 28 },
      { "name": "Amit", "count": 22 },
      { "name": "Priya", "count": 15 }
    ]
  },
  "weeklyTaskBreakdown": { "byStatus": [], "byPriority": [], "totalThisWeek": 0, "completedThisWeek": 0 },
  "meetingBreakdown": { "byStatus": [], "avgDurationMinutes": 0, "totalHours": 0, "upcomingCount": 0 },
  "trends": {
    "taskCompletion": {
      "2026-03-22": 5,
      "2026-03-23": 8,
      "2026-03-24": 6
    },
    "meetingFrequency": {}
  }
}
```

---

### 3. Company Snapshot

```
GET /api/analytics-snapshot/company/:companyId
```

Full organisation-wide analytics — all teams, all meetings, all weekly tasks.

**Example response:**

```json
{
  "scope": "company",
  "scopeId": "660abc000000000000000001",
  "summary": {
    "totalProjectTasks": 540,
    "completedProjectTasks": 320,
    "overdueProjectTasks": 18,
    "inProgressProjectTasks": 95,
    "completionRate": 59,
    "overdueRate": 3,
    "recentlyCompletedLast7Days": 42,
    "totalWeeklyTasks": 85,
    "completedWeeklyTasks": 63,
    "totalMeetings": 48,
    "upcomingMeetings": 6,
    "meetingHoursTotal": 112.5,
    "avgMeetingDurationMinutes": 52,
    "productivityScore": 66
  },
  "taskBreakdown": {
    "byStatus": [
      { "status": "COMPLETED", "count": 320 },
      { "status": "IN_PROGRESS", "count": 95 },
      { "status": "TODO", "count": 107 },
      { "status": "OVERDUE", "count": 18 }
    ],
    "byPriority": [
      { "priority": "HIGH", "count": 120 },
      { "priority": "MEDIUM", "count": 280 },
      { "priority": "LOW", "count": 140 }
    ],
    "recentlyCompleted": 42,
    "avgResolutionDays": 5.8
  },
  "weeklyTaskBreakdown": {
    "byStatus": [
      { "status": "done", "count": 63 },
      { "status": "todo", "count": 22 }
    ],
    "totalThisWeek": 85,
    "completedThisWeek": 63
  },
  "meetingBreakdown": {
    "byStatus": [
      { "status": "completed", "count": 40 },
      { "status": "scheduled", "count": 6 },
      { "status": "cancelled", "count": 2 }
    ],
    "avgDurationMinutes": 52,
    "totalHours": 112.5,
    "upcomingCount": 6
  },
  "trends": {
    "taskCompletion": {
      "2026-03-01": 12,
      "2026-03-08": 18,
      "2026-03-15": 22,
      "2026-03-22": 30
    },
    "meetingFrequency": {
      "2026-03-22": 3,
      "2026-03-24": 5,
      "2026-03-26": 4
    }
  }
}
```

---

## Field Reference

### `summary` — KPI Cards

| Field                       | Type    | Description                                              |
|-----------------------------|---------|----------------------------------------------------------|
| `totalProjectTasks`         | number  | Total project tasks in scope                             |
| `completedProjectTasks`     | number  | Tasks with status COMPLETED                              |
| `overdueProjectTasks`       | number  | Tasks past dueDate and not completed                     |
| `inProgressProjectTasks`    | number  | Tasks with status IN_PROGRESS                            |
| `completionRate`            | number  | `completed / total × 100` (percentage)                  |
| `overdueRate`               | number  | `overdue / total × 100` (percentage)                    |
| `recentlyCompletedLast7Days`| number  | Tasks completed in the last 7 days                       |
| `totalWeeklyTasks`          | number  | Weekly planner tasks in scope                            |
| `completedWeeklyTasks`      | number  | Completed weekly tasks                                   |
| `totalMeetings`             | number  | All meetings in scope                                    |
| `upcomingMeetings`          | number  | Meetings scheduled in the future                         |
| `meetingHoursTotal`         | number  | Sum of all meeting durations in hours                    |
| `avgMeetingDurationMinutes` | number  | Average meeting length in minutes                        |
| `productivityScore`         | number  | Weighted score 0–100 (completion rate − overdue penalty) |

---

### `taskBreakdown`

| Field               | Description                                             |
|---------------------|---------------------------------------------------------|
| `byStatus`          | `[{ status, count }]` — all project task statuses      |
| `byPriority`        | `[{ priority, count }]` — HIGH / MEDIUM / LOW          |
| `recentlyCompleted` | Tasks completed in the last 7 days                      |
| `avgResolutionDays` | Average days from creation to completion (last 90 days) |
| `workloadPerMember` | Team only — `[{ name, count }]` sorted by task count   |

---

### `weeklyTaskBreakdown`

| Field              | Description                          |
|--------------------|--------------------------------------|
| `byStatus`         | `[{ status, count }]`                |
| `byPriority`       | `[{ priority, count }]`              |
| `totalThisWeek`    | All weekly tasks                     |
| `completedThisWeek`| Completed weekly tasks               |

---

### `meetingBreakdown`

| Field                | Description                                  |
|----------------------|----------------------------------------------|
| `byStatus`           | `[{ status, count }]`                        |
| `avgDurationMinutes` | Average meeting duration in minutes          |
| `totalHours`         | Total hours spent in meetings                |
| `upcomingCount`      | Meetings still to happen                     |
| `participationRate`  | % of meetings the user participated in       |

---

### `trends`

Both fields are plain objects — date string keys, count values.
Covers the **last 30 days** of data.

```json
"trends": {
  "taskCompletion": { "2026-03-22": 5, "2026-03-23": 8 },
  "meetingFrequency": { "2026-03-22": 1, "2026-03-24": 3 }
}
```

**To convert to Chart.js / Recharts format:**

```js
const trend = snapshot.trends.taskCompletion;
const labels = Object.keys(trend);
const data   = Object.values(trend);
// → { labels: ['2026-03-22', ...], data: [5, ...] }
```

---

## Recommended Usage Pattern

```
Dashboard opens
    ↓
1. GET /api/analytics-snapshot/me        → render KPI cards + trends
2. GET /api/task-visuals/individual/*    → render individual charts
3. GET /api/meeting-visuals/individual/* → render meeting charts

User clicks a chart bar (e.g. "OVERDUE tasks")
    ↓
4. POST /api/project-tasks/list?status=OVERDUE  → show drill-down list

Team dashboard opens
    ↓
1. GET /api/analytics-snapshot/team/:teamId     → KPIs + workload table
2. GET /api/task-visuals/team/:teamId/*         → all team charts
```

---

## productivityScore Calculation

```
score = (completedTasks / totalTasks × 60)    ← max 60 points
      − (overdueTasks  / totalTasks × 30)    ← up to −30 points
      + (avgMeetingMins ≤ 60 ? 10 : 0)       ← +10 for healthy meetings
```

Range: `0–100`. Render as a gauge or progress bar.

| Score   | Label       | Color  |
|---------|-------------|--------|
| 80–100  | Excellent   | green  |
| 60–79   | Good        | teal   |
| 40–59   | Average     | yellow |
| 0–39    | Needs work  | red    |
