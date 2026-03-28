# Frontend Master API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all protected requests):** `Authorization: Bearer <access_token>`

All responses follow the envelope:
```json
{ "statusCode": 200, "success": true, "data": { ... } }
```
Error responses:
```json
{ "statusCode": 4xx, "success": false, "message": "..." }
```

---

## Table of Contents

1. [Auth](#1-auth)
2. [Profile](#2-profile)
3. [Notifications](#3-notifications)
4. [Meetings](#4-meetings)
5. [Teams](#5-teams)
6. [Team Members](#6-team-members)
7. [Team Snapshot (Charts)](#7-team-snapshot-charts)
8. [Project Tasks](#8-project-tasks)
9. [Comments](#9-comments)
10. [Weekly Tasks](#10-weekly-tasks)
11. [Weeks](#11-weeks)
12. [Projects](#12-projects)
13. [Columns](#13-columns)
14. [Priority](#14-priority)
15. [Status](#15-status)
16. [Task Visuals (Charts)](#16-task-visuals-charts)
17. [Meeting Visuals (Charts)](#17-meeting-visuals-charts)
18. [Analytics Snapshot](#18-analytics-snapshot)
19. [Settings & Account](#19-settings--account)
20. [File Manager](#20-file-manager)
21. [Company Users](#21-company-users)
22. [Roles](#22-roles)
23. [Activity Logs](#23-activity-logs)
24. [Leader Dashboard](#24-leader-dashboard)
25. [Analytics](#25-analytics)

---

## 1. Auth

No auth header required unless noted.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /auth/signup | Register new user |
| 2 | POST | /auth/verify-email | Verify email with OTP |
| 3 | POST | /auth/resend-otp | Resend verification OTP |
| 4 | POST | /auth/signin | Sign in → get tokens |
| 5 | POST | /auth/google | Google OAuth sign-in |
| 6 | POST | /auth/refresh-token | Refresh access token |
| 7 | POST | /auth/forgot-password | Request password reset |
| 8 | POST | /auth/reset-password | Submit new password |
| 9 | GET | /auth/me | Get current user (🔒) |

---

### 1.1 Sign Up

```
POST /auth/signup
```

**Payload:**
```json
{
  "email":     "user@example.com",
  "password":  "Secure123!",
  "firstName": "Jayvion",
  "lastName":  "Simon"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | yes | Valid email |
| `password` | string | yes | Min 8 characters |
| `firstName` | string | yes | |
| `lastName` | string | no | |

**Response:** `{ message: "OTP sent to email" }`

---

### 1.2 Verify Email

```
POST /auth/verify-email
```

**Payload:**
```json
{ "email": "user@example.com", "otp": "482910" }
```

---

### 1.3 Resend OTP

```
POST /auth/resend-otp
```

**Payload:**
```json
{ "email": "user@example.com" }
```

---

### 1.4 Sign In

```
POST /auth/signin
```

**Payload:**
```json
{ "email": "user@example.com", "password": "Secure123!" }
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "680abc...",
    "email": "user@example.com",
    "fullName": "Jayvion Simon",
    "role": "user"
  }
}
```

> Store `accessToken` in memory / Redux; store `refreshToken` in `httpOnly` cookie or localStorage.

---

### 1.5 Google Sign-In

```
POST /auth/google
```

**Payload:**
```json
{ "idToken": "<Google ID token from Google SDK>" }
```

**Response:** same shape as sign-in.

---

### 1.6 Refresh Token

```
POST /auth/refresh-token
```

**Payload:**
```json
{ "refreshToken": "eyJ..." }
```

**Response:** `{ "accessToken": "eyJ..." }`

> Call this automatically when a 401 is received. Intercept → refresh → retry original request.

---

### 1.7 Forgot Password

```
POST /auth/forgot-password
```

**Payload:**
```json
{ "email": "user@example.com" }
```

---

### 1.8 Reset Password

```
POST /auth/reset-password
```

**Payload:**
```json
{
  "email":       "user@example.com",
  "otp":         "482910",
  "newPassword": "NewSecure123!"
}
```

---

### 1.9 Get Current User 🔒

```
GET /auth/me
```

**Response:**
```json
{
  "id": "680abc...",
  "email": "user@example.com",
  "fullName": "Jayvion Simon",
  "role": "user",
  "avatarUrl": "http://localhost:4000/uploads/avatars/680abc.jpg"
}
```

---

## 2. Profile

All endpoints require `Authorization: Bearer <token>`.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/users/profile | Fetch current user's profile |
| 2 | PATCH | /api/users/profile | Update profile details |
| 3 | PATCH | /api/users/social-links | Replace all social links |
| 4 | POST | /api/users/avatar | Upload avatar image |
| 5 | DELETE | /api/users/account | Delete account permanently |

---

### 2.1 Get Profile

```
GET /api/users/profile
```

**Response:**
```json
{
  "id": "680abc...",
  "name": "Jayvion Simon",
  "email": "jayvion@example.com",
  "location": "San Francisco, CA",
  "jobPost": "Senior Frontend Engineer",
  "studyAt": "Stanford University",
  "about": "Passionate about building clean UIs.",
  "avatarUrl": "http://localhost:4000/uploads/avatars/680abc.jpg",
  "socialLinks": [
    { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
    { "platform": "instagram", "url": "" },
    { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
    { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
  ]
}
```

---

### 2.2 Update Profile

```
PATCH /api/users/profile
```

**Payload:** (all fields optional — send only what changed)
```json
{
  "name":     "Jayvion Simon",
  "email":    "jayvion@example.com",
  "location": "San Francisco, CA",
  "jobPost":  "Senior Frontend Engineer",
  "studyAt":  "Stanford University",
  "about":    "Passionate about building clean and scalable UIs."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | no | Full display name |
| `email` | string | no | Valid email |
| `location` | string | no | Free text |
| `jobPost` | string | no | Job title |
| `studyAt` | string | no | Institution |
| `about` | string | no | Max 500 chars |

**Response:** Updated profile object + `updatedAt`.

---

### 2.3 Save Social Links

```
PATCH /api/users/social-links
```

**Payload:** Always send all 4 platforms; use empty string for no link.
```json
{
  "socialLinks": [
    { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
    { "platform": "instagram", "url": "" },
    { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
    { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
  ]
}
```

Supported platforms: `facebook` · `instagram` · `linkedin` · `twitter`

---

### 2.4 Upload Avatar

```
POST /api/users/avatar
Content-Type: multipart/form-data
```

| Field | Type | Notes |
|-------|------|-------|
| `avatar` | File | JPEG / PNG / WebP — max 5 MB |

**Response:**
```json
{ "avatarUrl": "http://localhost:4000/uploads/avatars/680abc.jpg" }
```

```tsx
// Upload example
const form = new FormData();
form.append('avatar', fileInput.files[0]);
await fetch('/api/users/avatar', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
```

---

### 2.5 Delete Account

```
DELETE /api/users/account
```

**Payload:** User must type "DELETE" to confirm.
```json
{ "confirmation": "DELETE" }
```

> On success: clear tokens → clear store → redirect to `/`.

---

## 3. Notifications

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/notifications | Paginated list + tab counts |
| 2 | PATCH | /api/notifications/read-all | Mark all as read |
| 3 | DELETE | /api/notifications | Delete all |
| 4 | PATCH | /api/notifications/:id/read | Mark one as read |
| 5 | PATCH | /api/notifications/:id/unread | Mark one as unread |
| 6 | DELETE | /api/notifications/:id | Delete one |

---

### 3.1 Get Notifications

```
GET /api/notifications
```

**Query params:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `page` | number | `1` | |
| `limit` | number | `25` | |
| `type` | string | `all` | `all` \| `tasks` \| `meetings` \| `system` \| `mentions` |
| `read` | boolean | — | `true` = read only, `false` = unread only |

**Response:**
```json
{
  "data": [
    {
      "id": "68012abc...",
      "userId": "68011abc...",
      "title": "Task assigned to you",
      "message": "Rahul assigned \"Fix login bug\" to you",
      "type": "TASK_ASSIGNED",
      "read": false,
      "createdAt": "2026-03-28T10:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 25,
  "counts": {
    "all": 42,
    "tasks": 18,
    "meetings": 11,
    "system": 5,
    "mentions": 8
  }
}
```

> `counts` is always unfiltered — plug directly into tab labels.
> Unread badge count: `GET /api/notifications?read=false&limit=1` → use `total`.

---

### 3.2–3.6 Bulk & Per-item Actions

```
PATCH  /api/notifications/read-all   → { message: "12 notification(s) marked as read" }
DELETE /api/notifications             → { message: "42 notification(s) deleted" }
PATCH  /api/notifications/:id/read   → updated notification object
PATCH  /api/notifications/:id/unread → updated notification object (read: false)
DELETE /api/notifications/:id        → { message: "Notification deleted" }
```

All — no body required.

---

## 4. Meetings

All endpoints require auth. Base: `/api/meetings`

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/meetings/analytics | 4 summary KPI cards |
| 2 | GET | /api/meetings/analytics/per-day | Bar chart — meetings per day |
| 3 | GET | /api/meetings/analytics/duration | Pie chart — duration distribution |
| 4 | GET | /api/meetings/analytics/participation-trend | Line chart — participant trend |
| 5 | GET | /api/meetings/next | Next upcoming meeting |
| 6 | GET | /api/meetings/streak | Attendance streak |
| 7 | GET | /api/meetings/badges | Achievement badges |
| 8 | GET | /api/meetings | Paginated meetings list |
| 9 | POST | /api/meetings | Create meeting |
| 10 | PATCH | /api/meetings/:id | Update meeting |
| 11 | PATCH | /api/meetings/:id/cancel | Cancel meeting |
| 12 | DELETE | /api/meetings/:id | Delete meeting |

---

### 4.1 Analytics Summary Cards

```
GET /api/meetings/analytics
```

**Response:**
```json
{
  "totalMeetings": 42,
  "upcomingMeetings": 8,
  "completedMeetings": 30,
  "canceledMeetings": 4,
  "totalHours": 86.5,
  "avgDurationMinutes": 45
}
```

---

### 4.2 Per-Day Bar Chart

```
GET /api/meetings/analytics/per-day?startDate=2026-03-01&endDate=2026-03-31
```

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `startDate` | ISO date string | Optional |
| `endDate` | ISO date string | Optional |

**Response:**
```json
[
  { "date": "2026-03-01", "count": 3 },
  { "date": "2026-03-02", "count": 1 }
]
```

---

### 4.3 Duration Distribution Pie

```
GET /api/meetings/analytics/duration?startDate=2026-03-01&endDate=2026-03-31
```

**Response:**
```json
[
  { "range": "< 30 min", "count": 10 },
  { "range": "30–60 min", "count": 25 },
  { "range": "> 60 min", "count": 7 }
]
```

---

### 4.4 Participation Trend Line Chart

```
GET /api/meetings/analytics/participation-trend?startDate=2026-03-01&endDate=2026-03-31&groupBy=day
```

**Query params:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `startDate` | ISO date | — | |
| `endDate` | ISO date | — | |
| `groupBy` | string | `day` | `day` \| `week` \| `month` |

**Response:**
```json
[
  { "date": "2026-03-01", "participants": 12 },
  { "date": "2026-03-08", "participants": 18 }
]
```

---

### 4.5–4.7 Overview Cards

```
GET /api/meetings/next
```
```json
{
  "id": "680abc...",
  "title": "Weekly Sync",
  "startTime": "2026-03-29T14:00:00.000Z",
  "endTime":   "2026-03-29T15:00:00.000Z",
  "participants": [{ "userId": "...", "name": "Alice", "avatar": null }]
}
```

```
GET /api/meetings/streak
```
```json
{ "currentStreak": 5, "longestStreak": 12 }
```

```
GET /api/meetings/badges
```
```json
[
  { "id": "first_meeting", "label": "First Meeting",  "earned": true },
  { "id": "streak_5",      "label": "5-Day Streak",   "earned": true },
  { "id": "streak_10",     "label": "10-Day Streak",  "earned": false }
]
```

---

### 4.8 List Meetings

```
GET /api/meetings
```

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | `1` | |
| `limit` | number | `20` | |
| `status` | string | `All` | `All` \| `Upcoming` \| `Ongoing` \| `Completed` \| `Canceled` |
| `search` | string | — | Title search |
| `startDate` | ISO date | — | Filter from |
| `endDate` | ISO date | — | Filter to |

**Response:**
```json
{
  "data": [
    {
      "id": "680abc...",
      "title": "Weekly Sync",
      "description": "Team catch-up",
      "startTime": "2026-03-29T14:00:00.000Z",
      "endTime":   "2026-03-29T15:00:00.000Z",
      "meetingLink": "https://meet.google.com/xxx",
      "status": "Upcoming",
      "isRecurring": true,
      "recurringDays": [1, 3, 5],
      "meetingType": "google_meet",
      "createdBy": { "userId": "...", "name": "Jayvion Simon" },
      "participants": [
        { "userId": "...", "name": "Alice", "status": "pending" }
      ]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### 4.9 Create Meeting

```
POST /api/meetings
```

**Payload:**
```json
{
  "title":          "Weekly Sync",
  "description":    "Team catch-up",
  "meetingLink":    "https://meet.google.com/xxx",
  "startTime":      "2026-03-29T14:00:00.000Z",
  "endTime":        "2026-03-29T15:00:00.000Z",
  "participantIds": ["680user1...", "680user2..."],
  "isRecurring":    true,
  "recurringDays":  [1, 3, 5],
  "meetingType":    "google_meet"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `startTime` | ISO string | yes | |
| `endTime` | ISO string | yes | |
| `participantIds` | string[] | yes | Array of user IDs |
| `isRecurring` | boolean | yes | |
| `recurringDays` | number[] | if recurring | `0`=Sun … `6`=Sat |
| `description` | string | no | |
| `meetingLink` | string | no | |
| `meetingType` | string | no | `google_meet` \| `zoom` \| `teams` \| `other` |

> Get user IDs for participants from `GET /api/users/participants?search=alice`

---

### 4.10 Update Meeting

```
PATCH /api/meetings/:id
```

**Payload:** (any subset of create fields)
```json
{
  "title": "Updated Sync",
  "startTime": "2026-03-29T15:00:00.000Z"
}
```

---

### 4.11 Cancel Meeting

```
PATCH /api/meetings/:id/cancel
```

**Payload:**
```json
{ "reason": "Presenter is unavailable" }
```

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | no |

---

### 4.12 Delete Meeting

```
DELETE /api/meetings/:id
```

No body. Response: `{ message: "Meeting deleted" }`

---

## 5. Teams

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /teams | Create team |
| 2 | GET | /teams | List all teams |
| 3 | GET | /teams/:id | Get one team |
| 4 | PATCH | /teams/:id | Update team |
| 5 | DELETE | /teams/:id | Delete team |

---

### 5.1 Create Team

```
POST /teams
```

**Payload:**
```json
{ "name": "Frontend Squad" }
```

---

### 5.2 List Teams

```
GET /teams
```

**Response:**
```json
[
  {
    "id": "680team...",
    "name": "Frontend Squad",
    "createdBy": { "userId": "680abc...", "name": "Jayvion Simon" },
    "teamMembers": [{ "id": "...", "name": "Alice" }],
    "createdAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

### 5.3 Get One Team

```
GET /teams/:id
```

---

### 5.4 Update Team

```
PATCH /teams/:id
```

**Payload:**
```json
{ "name": "Backend Squad" }
```

---

### 5.5 Delete Team

```
DELETE /teams/:id
```

---

## 6. Team Members

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /team-members | Add members to a team |
| 2 | GET | /team-members/:teamId | List members of a team |
| 3 | DELETE | /team-members/:id | Remove one member |

---

### 6.1 Add Members

```
POST /team-members
```

**Payload:**
```json
{
  "teamId": "680team...",
  "members": [
    { "userId": "680user1...", "name": "Alice" },
    { "userId": "680user2...", "name": "Bob" }
  ],
  "createdBy": { "userId": "680abc...", "name": "Jayvion Simon" }
}
```

---

### 6.2 List Members

```
GET /team-members/:teamId
```

**Response:**
```json
[
  {
    "id": "680mem...",
    "teamId": "680team...",
    "teamName": "Frontend Squad",
    "name": "Alice",
    "createdBy": { "userId": "...", "name": "Jayvion Simon" },
    "createdAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

### 6.3 Remove Member

```
DELETE /team-members/:id
```

---

## 7. Team Snapshot (Charts)

All endpoints require auth. Snapshots are pre-aggregated and updated automatically when teams/members change.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/team-snapshot/:teamId | All 6 charts at once |
| 2 | GET | /api/team-snapshot/:teamId/member-count | Members over time |
| 3 | GET | /api/team-snapshot/:teamId/task-status | Task status breakdown |
| 4 | GET | /api/team-snapshot/:teamId/task-priority | Task priority breakdown |
| 5 | GET | /api/team-snapshot/:teamId/workload | Workload per member |
| 6 | GET | /api/team-snapshot/:teamId/completion-trend | Completion trend line |
| 7 | GET | /api/team-snapshot/:teamId/member-growth | Member growth line |

---

### 7.1 All Charts

```
GET /api/team-snapshot/:teamId
```

**Response:**
```json
{
  "memberCount":      { "title": "Member Count",       "chartType": "stat",   "data": { "count": 8 } },
  "taskStatus":       { "title": "Task Status",        "chartType": "pie",    "data": [{ "status": "TODO", "count": 12 }] },
  "taskPriority":     { "title": "Task Priority",      "chartType": "bar",    "data": [{ "priority": "HIGH", "count": 5 }] },
  "workload":         { "title": "Member Workload",     "chartType": "bar",    "data": [{ "member": "Alice", "taskCount": 4 }] },
  "completionTrend":  { "title": "Completion Trend",   "chartType": "line",   "data": [{ "date": "2026-03-01", "completed": 3 }] },
  "memberGrowth":     { "title": "Member Growth",      "chartType": "line",   "data": [{ "date": "2026-03-01", "count": 5 }] }
}
```

---

## 8. Project Tasks

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /project-tasks | Create task |
| 2 | POST | /project-tasks/list | List/filter tasks |
| 3 | GET | /project-tasks/:id | Get one task |
| 4 | PUT | /project-tasks/:id | Full update |
| 5 | PATCH | /project-tasks/:id | Partial update |
| 6 | DELETE | /project-tasks/:id | Delete task |

---

### 8.1 Create Task

```
POST /project-tasks
```

**Payload:**
```json
{
  "title":      "Fix login bug",
  "teamId":     "680team...",
  "companyId":  "680comp...",
  "priority":   "HIGH",
  "status":     "TODO",
  "inchargeId":    "680user...",
  "inchargeName":  "Alice",
  "columnId":      "680col...",
  "dueDate":       "2026-04-01T00:00:00.000Z",
  "taskContent":   {},
  "renderedHtml":  "<p>...</p>",
  "contentPreview":"Plain text preview"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `teamId` | string | yes | ObjectId |
| `companyId` | string | yes | ObjectId |
| `priority` | string | no | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | string | no | `TODO` \| `IN_PROGRESS` \| `DONE` etc. |
| `inchargeId` | string | no | Assigned user ObjectId |
| `inchargeName` | string | no | |
| `columnId` | string | no | Kanban column ObjectId |
| `dueDate` | ISO string | no | |
| `taskContent` | object | no | TipTap/ProseMirror JSON |
| `renderedHtml` | string | no | |
| `contentPreview` | string | no | |

---

### 8.2 List / Filter Tasks

```
POST /project-tasks/list
```

**Payload:**
```json
{
  "teamId":    "680team...",
  "companyId": "680comp...",
  "status":    "TODO",
  "priority":  "HIGH",
  "search":    "login",
  "page":      1,
  "limit":     25
}
```

All fields optional.

---

### 8.3 Get One Task

```
GET /project-tasks/:id
```

---

### 8.4 Full Update

```
PUT /project-tasks/:id
```

Same payload shape as create (all fields).

---

### 8.5 Partial Update (status/column drag)

```
PATCH /project-tasks/:id
```

**Payload:** (any subset)
```json
{
  "status":   "IN_PROGRESS",
  "columnId": "680col2..."
}
```

---

### 8.6 Delete Task

```
DELETE /project-tasks/:id
```

---

## 9. Comments

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /comments | Create comment (or reply) |
| 2 | GET | /comments/task/:taskId | List comments for a task |
| 3 | PUT | /comments/:id | Edit a comment |
| 4 | DELETE | /comments/:id | Delete a comment |

---

### 9.1 Create Comment

```
POST /comments
```

**Payload:**
```json
{
  "taskId":        "680task...",
  "comment":       { "type": "doc", "content": [...] },
  "renderedHtml":  "<p>Looks good!</p>",
  "contentPreview":"Looks good!",
  "parentId":      null
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `taskId` | string | yes | |
| `comment` | object | no | ProseMirror JSON |
| `renderedHtml` | string | no | |
| `contentPreview` | string | no | |
| `parentId` | string | no | Set for replies |

---

### 9.2 List Task Comments

```
GET /comments/task/:taskId
```

**Response:** Array of comments with nested `replies[]`.

---

### 9.3 Edit Comment

```
PUT /comments/:id
```

**Payload:**
```json
{
  "comment":      { "type": "doc", "content": [...] },
  "renderedHtml": "<p>Updated text</p>"
}
```

---

### 9.4 Delete Comment

```
DELETE /comments/:id
```

---

## 10. Weekly Tasks

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /weekly-tasks | Create weekly task |
| 2 | POST | /weekly-tasks/list | List/filter tasks |
| 3 | GET | /weekly-tasks/:taskId | Get one task |
| 4 | PUT | /weekly-tasks | Full update |
| 5 | DELETE | /weekly-tasks/:taskId | Delete task |

---

### 10.1 Create Weekly Task

```
POST /weekly-tasks
```

**Payload:**
```json
{
  "weekId":     "680week...",
  "dayId":      "680day...",
  "title":      "Finish report",
  "content":    "Write the monthly report",
  "startDate":  "2026-03-25",
  "dueDate":    "2026-03-28",
  "priority":   "high",
  "status":     "todo",
  "blocker":    "Waiting for data from Finance",
  "assignedTo": "Alice"
}
```

All fields optional.

---

### 10.2 List Weekly Tasks

```
POST /weekly-tasks/list
```

**Payload:**
```json
{
  "dayId":     "680day...",
  "monthName": "March",
  "year":      2026,
  "page":      1,
  "limit":     25
}
```

All fields optional.

---

### 10.3 Get One

```
GET /weekly-tasks/:taskId
```

---

### 10.4 Update

```
PUT /weekly-tasks
```

**Payload:** Same as create + required `id` field:
```json
{
  "id":     "680task...",
  "status": "in_progress",
  "title":  "Finish report (updated)"
}
```

---

### 10.5 Delete

```
DELETE /weekly-tasks/:taskId
```

---

## 11. Weeks

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /weeks | Create a week |
| 2 | GET | /weeks | List user's weeks |
| 3 | DELETE | /weeks/:weekId | Delete a week |

---

### 11.1 Create Week

```
POST /weeks
```

**Payload:**
```json
{
  "label":      "Week 1",
  "weekNumber": 1,
  "month": {
    "monthId": "680month...",
    "name":    "March",
    "number":  3
  },
  "year":      2026,
  "startDate": "2026-03-24T00:00:00.000Z",
  "endDate":   "2026-03-30T00:00:00.000Z",
  "days": [
    { "dayId": "680day1...", "name": "Monday",  "date": "2026-03-24T00:00:00.000Z" },
    { "dayId": "680day2...", "name": "Tuesday", "date": "2026-03-25T00:00:00.000Z" }
  ]
}
```

---

### 11.2 List Weeks

```
GET /weeks
```

Returns all weeks for the current user.

---

### 11.3 Delete Week

```
DELETE /weeks/:weekId
```

---

## 12. Projects

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /projects | Create project |
| 2 | GET | /projects | List projects |
| 3 | GET | /projects/:id | Get one project |
| 4 | PUT | /projects/:id | Update project |
| 5 | DELETE | /projects/:id | Delete project |

---

### 12.1 Create Project

```
POST /projects
```

**Payload:**
```json
{
  "name":        "Redesign Dashboard",
  "description": "Full redesign of the main dashboard",
  "companyId":   "680comp...",
  "teamId":      "680team..."
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `companyId` | string | yes |
| `description` | string | no |
| `teamId` | string | no |

---

### 12.2–12.5 List / Get / Update / Delete

```
GET    /projects             → array of projects
GET    /projects/:id         → single project
PUT    /projects/:id         → { name, description, teamId }
DELETE /projects/:id         → { message: "Project deleted" }
```

---

## 13. Columns

All endpoints require auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /columns | Create column |
| 2 | GET | /columns | List all columns |
| 3 | PATCH | /columns/:id | Update label |
| 4 | DELETE | /columns/:id | Delete column |

---

### 13.1 Create Column

```
POST /columns
```

**Payload:**
```json
{ "name": "in_review", "label": "In Review", "isDefault": false }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Immutable key |
| `label` | string | yes | Display name |
| `isDefault` | boolean | no | |

---

### 13.2 List Columns

```
GET /columns
```

Returns all columns. Use to populate Kanban board headers.

---

### 13.3 Update Column

```
PATCH /columns/:id
```

**Payload:**
```json
{ "label": "Under Review" }
```

---

### 13.4 Delete Column

```
DELETE /columns/:id
```

---

## 14. Priority

Same pattern as Columns.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /priority | Create priority |
| 2 | GET | /priority | List all priorities |
| 3 | PATCH | /priority/:id | Update label |
| 4 | DELETE | /priority/:id | Delete priority |

**Create payload:**
```json
{ "name": "critical", "label": "Critical", "isDefault": false }
```

---

## 15. Status

Same pattern as Columns/Priority.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /status | Create status |
| 2 | GET | /status | List all statuses |
| 3 | PATCH | /status/:id | Update label |
| 4 | DELETE | /status/:id | Delete status |

**Create payload:**
```json
{ "name": "blocked", "label": "Blocked", "isDefault": false }
```

---

## 16. Task Visuals (Charts)

All endpoints require auth. Pre-aggregated snapshots — refresh automatically on task mutations.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/task-visuals/individual | All individual charts |
| 2 | GET | /api/task-visuals/individual/task-status | Task status pie |
| 3 | GET | /api/task-visuals/individual/priority | Priority bar |
| 4 | GET | /api/task-visuals/individual/workload | Workload bar |
| 5 | GET | /api/task-visuals/individual/completion-trend | Completion line |
| 6 | GET | /api/task-visuals/individual/overdue | Overdue stat |
| 7 | GET | /api/task-visuals/individual/productivity | Productivity score |

---

### 16.1 All Individual Charts

```
GET /api/task-visuals/individual
```

**Response:**
```json
{
  "taskStatus":       { "title": "Task Status",       "chartType": "pie",  "data": [{ "status": "TODO", "count": 5 }] },
  "priority":         { "title": "Priority Breakdown", "chartType": "bar",  "data": [{ "priority": "HIGH", "count": 3 }] },
  "workload":         { "title": "Weekly Workload",    "chartType": "bar",  "data": [{ "week": "W1", "count": 8 }] },
  "completionTrend":  { "title": "Completion Trend",  "chartType": "line", "data": [{ "date": "2026-03-01", "completed": 2 }] },
  "overdue":          { "title": "Overdue Tasks",      "chartType": "stat", "data": { "count": 3 } },
  "productivity":     { "title": "Productivity Score", "chartType": "stat", "data": { "score": 78 } }
}
```

---

## 17. Meeting Visuals (Charts)

All endpoints require auth. Base: `/api/meeting-visuals`

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/meeting-visuals/individual | All individual charts |
| 2 | GET | /api/meeting-visuals/individual/meeting-status | Status pie |
| 3 | GET | /api/meeting-visuals/individual/duration-trend | Duration line |
| 4 | GET | /api/meeting-visuals/individual/frequency | Frequency bar |
| 5 | GET | /api/meeting-visuals/individual/participant-engagement | Engagement bar |
| 6 | GET | /api/meeting-visuals/individual/time-of-day | Time-of-day bar |
| 7 | GET | /api/meeting-visuals/individual/recurring-ratio | Recurring ratio pie |

---

### 17.1 All Individual Charts

```
GET /api/meeting-visuals/individual
```

**Response:**
```json
{
  "meetingStatus":         { "chartType": "pie",  "data": [{ "status": "Completed", "count": 30 }] },
  "durationTrend":         { "chartType": "line", "data": [{ "date": "2026-03-01", "avgMinutes": 45 }] },
  "frequency":             { "chartType": "bar",  "data": [{ "week": "W1", "count": 4 }] },
  "participantEngagement": { "chartType": "bar",  "data": [{ "name": "Alice", "attended": 8 }] },
  "timeOfDay":             { "chartType": "bar",  "data": [{ "hour": "09:00", "count": 5 }] },
  "recurringRatio":        { "chartType": "pie",  "data": [{ "type": "Recurring", "count": 15 }, { "type": "One-time", "count": 27 }] }
}
```

---

## 18. Analytics Snapshot

Requires auth. Combines project tasks + weekly tasks + meetings into a rich summary.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/analytics-snapshot | Current user's full snapshot |
| 2 | GET | /api/analytics-snapshot/team/:teamId | Team snapshot |
| 3 | GET | /api/analytics-snapshot/company/:companyId | Company snapshot |

---

### 18.1 User Snapshot

```
GET /api/analytics-snapshot
```

**Response:**
```json
{
  "summary": {
    "totalTasks": 42,
    "completedTasks": 30,
    "overdueTasks": 3,
    "completionRate": 71.4,
    "totalMeetings": 15,
    "meetingHoursTotal": 12.5,
    "productivityScore": 78
  },
  "taskBreakdown": {
    "byStatus":   [{ "status": "TODO", "count": 12 }],
    "byPriority": [{ "priority": "HIGH", "count": 5 }],
    "recentlyCompleted": [...],
    "avgResolutionDays": 3.2
  },
  "weeklyTaskBreakdown": { ... },
  "meetingBreakdown":    { ... },
  "trends": {
    "taskCompletion":  [{ "date": "2026-03-01", "count": 2 }],
    "meetingFrequency":[{ "date": "2026-03-01", "count": 1 }]
  }
}
```

---

## 19. Settings & Account

All endpoints require auth. Base: `/api/settings`

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/settings | All settings (pre-fill all tabs) |
| **Notifications** | | | |
| 2 | PATCH | /api/settings/notifications | Save notification preferences |
| **Security** | | | |
| 3 | PATCH | /api/settings/security/two-factor | Toggle 2FA |
| 4 | GET | /api/settings/security/devices | List active sessions |
| 5 | DELETE | /api/settings/security/devices | Revoke all other sessions |
| 6 | DELETE | /api/settings/security/devices/:id | Revoke one session |
| **Extensions** | | | |
| 7 | PATCH | /api/settings/extensions | Save extension preferences |
| **Danger Zone** | | | |
| 8 | POST | /api/settings/reset | Reset all to defaults |
| **Account — Status** | | | |
| 9 | PATCH | /api/settings/account/status | Toggle active/inactive |
| **Account — Billing** | | | |
| 10 | GET | /api/settings/account/billing | Get billing info + plan |
| 11 | PATCH | /api/settings/account/billing | Update billing details |
| 12 | PATCH | /api/settings/account/plan | Change plan |
| 13 | DELETE | /api/settings/account/plan | Cancel plan |
| 14 | GET | /api/settings/account/invoices | List invoices |
| 15 | GET | /api/settings/account/invoices/:id/download | Download PDF |

---

### 19.1 Get All Settings

```
GET /api/settings
```

**Response:**
```json
{
  "notifications": {
    "taskReminders": true,
    "meetingReminders": true,
    "challengeUpdates": false,
    "systemUpdates": true,
    "frequency": "realtime"
  },
  "security": { "twoFactorEnabled": false },
  "extensions": {
    "floatingIcon": true,
    "autoPinExtension": false,
    "iconPosition": "bottomRight"
  },
  "account": {
    "isActive": true,
    "planId": "starter",
    "billing": {
      "billingName": "Jayvion Simon",
      "billingAddress": "19034 Verna Unions Apt. 164",
      "billingPhone": "+1 202-555-0143",
      "paymentMethodId": "pm_visa_5678"
    }
  }
}
```

---

### 19.2 Save Notification Preferences

```
PATCH /api/settings/notifications
```

**Payload:**
```json
{
  "taskReminders":    true,
  "meetingReminders": true,
  "challengeUpdates": false,
  "systemUpdates":    true,
  "frequency":        "realtime"
}
```

`frequency` values: `"realtime"` | `"daily"` | `"weekly"`

---

### 19.3 Toggle 2FA

```
PATCH /api/settings/security/two-factor
```

**Payload:**
```json
{ "enabled": true }
```

**Response:**
```json
{ "twoFactorEnabled": true, "message": "Two-factor authentication enabled" }
```

---

### 19.4 List Devices / Sessions

```
GET /api/settings/security/devices
```

**Response:**
```json
[
  {
    "id": "680sess...",
    "name": "Chrome on Windows",
    "type": "Desktop",
    "location": "San Francisco, CA",
    "lastActive": "2026-03-28T10:00:00.000Z",
    "isCurrent": true
  }
]
```

---

### 19.5 Revoke All Other Sessions

```
DELETE /api/settings/security/devices
```

**Response:** `{ message: "3 other session(s) revoked" }`

---

### 19.6 Revoke One Session

```
DELETE /api/settings/security/devices/:id
```

**Response:** `{ message: "Session revoked" }`

---

### 19.7 Save Extension Preferences

```
PATCH /api/settings/extensions
```

**Payload:**
```json
{
  "floatingIcon":    true,
  "autoPinExtension": false,
  "iconPosition":    "bottomRight"
}
```

`iconPosition` values: `"bottomRight"` | `"bottomLeft"`

---

### 19.8 Reset to Defaults

```
POST /api/settings/reset
```

No body. **Response:** `{ message: "Settings reset to defaults" }`
> After success, re-fetch `GET /api/settings` to reload all tabs.

---

### 19.9 Toggle Account Status

```
PATCH /api/settings/account/status
```

**Payload:**
```json
{ "isActive": false }
```

---

### 19.10 Get Billing Info & Plan

```
GET /api/settings/account/billing
```

**Response:**
```json
{
  "currentPlan": {
    "id": "starter", "name": "Starter", "price": 4.99,
    "priceUnit": "month",
    "features": ["200 meetings/month", "50 GB storage", "10 team members"]
  },
  "billingCycle": "monthly",
  "nextPaymentDate": "2026-04-28",
  "billing": { "billingName": "Jayvion Simon", "billingAddress": "...", "billingPhone": "+1 202-555-0143" },
  "paymentMethods": [
    { "id": "pm_visa_5678", "type": "Visa", "lastFour": "5678", "expiry": "12/25", "isDefault": true }
  ],
  "availablePlans": [
    { "id": "basic",   "name": "Basic",   "price": 0,    "isCurrent": false },
    { "id": "starter", "name": "Starter", "price": 4.99, "isCurrent": true  },
    { "id": "premium", "name": "Premium", "price": 9.99, "isCurrent": false }
  ]
}
```

---

### 19.11 Update Billing Details

```
PATCH /api/settings/account/billing
```

**Payload:**
```json
{
  "billingName":    "Jayvion Simon",
  "billingAddress": "19034 Verna Unions Apt. 164",
  "billingPhone":   "+1 202-555-0143",
  "paymentMethodId": "pm_visa_5678"
}
```

---

### 19.12 Change Plan

```
PATCH /api/settings/account/plan
```

**Payload:**
```json
{ "planId": "premium" }
```

`planId` values: `"basic"` | `"starter"` | `"premium"`

---

### 19.13 Cancel Plan

```
DELETE /api/settings/account/plan
```

No body. **Response:** `{ message: "Plan cancelled. Access continues until end of billing period." }`

---

### 19.14 List Invoices

```
GET /api/settings/account/invoices?page=1&limit=10
```

**Response:**
```json
{
  "data": [
    { "id": "inv_001", "date": "2026-01-01", "amount": "$4.99", "status": "Paid" }
  ],
  "total": 3, "page": 1, "limit": 10
}
```

---

### 19.15 Download Invoice PDF

```
GET /api/settings/account/invoices/:id/download
```

**Response:** `Content-Type: application/pdf` binary stream.

```tsx
const handleDownload = async (invoiceId: string) => {
  const res = await fetch(`/api/settings/account/invoices/${invoiceId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `invoice-${invoiceId}.pdf`; a.click();
  URL.revokeObjectURL(url);
};
```

---

## 20. File Manager

All endpoints require auth. Base: `/api/file-manager`

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /api/file-manager | Upload a file |
| 2 | GET | /api/file-manager | List files (paginated) |
| 3 | GET | /api/file-manager/:id | Get one file |
| 4 | PATCH | /api/file-manager/:id | Update name / folder |
| 5 | DELETE | /api/file-manager/:id | Delete file |

---

### 20.1 Upload File

```
POST /api/file-manager
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | yes | Any type — max 50 MB |
| `folder` | string | no | Folder/category name |
| `name` | string | no | Display name (defaults to filename) |

**Response:**
```json
{
  "id":        "680file...",
  "userId":    "680abc...",
  "url":       "http://localhost:4000/uploads/files/uuid.pdf",
  "name":      "Q1 Report.pdf",
  "size":      204800,
  "mimeType":  "application/pdf",
  "folder":    "reports",
  "createdAt": "2026-03-28T10:00:00.000Z"
}
```

```tsx
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('folder', 'reports');
form.append('name', 'Q1 Report');
await fetch('/api/file-manager', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
```

---

### 20.2 List Files

```
GET /api/file-manager
```

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | Default `1` |
| `limit` | number | Default `20` |
| `folder` | string | Filter by folder |
| `search` | string | Search by name |

**Response:**
```json
{
  "data": [ { "id": "...", "name": "Q1 Report.pdf", "size": 204800, "mimeType": "application/pdf", "folder": "reports", "url": "...", "createdAt": "..." } ],
  "total": 15, "page": 1, "limit": 20
}
```

---

### 20.3 Get One File

```
GET /api/file-manager/:id
```

Returns single file object.

---

### 20.4 Update File

```
PATCH /api/file-manager/:id
```

**Payload:**
```json
{ "name": "Q1 Report Final.pdf", "folder": "archive" }
```

Both fields optional.

---

### 20.5 Delete File

```
DELETE /api/file-manager/:id
```

**Response:** `{ message: "File deleted successfully" }`
> Deletes both the DB record and the physical file from disk.

---

## 21. Company Users

Used for the internal org (company) user management. Separate auth flow from regular users.

### Summary

| # | Method | Endpoint | Purpose | Auth |
|---|--------|----------|---------|------|
| 1 | POST | /company-users/auth/signin | Company user sign in | ❌ |
| 2 | POST | /company-users/auth/change-password | Change own password | 🔒 |
| 3 | POST | /company-users | Create member (admin) | 🔒 admin |
| 4 | POST | /company-users/:id/regenerate-temp-password | Reset temp password (admin) | 🔒 admin |
| 5 | GET | /company-users | List members | 🔒 |
| 6 | GET | /company-users/:id | Get one member | 🔒 |
| 7 | PUT | /company-users/:id | Update member (admin) | 🔒 admin |
| 8 | DELETE | /company-users/:id | Remove member (admin) | 🔒 admin |

---

### 21.1 Company Sign In

```
POST /company-users/auth/signin
```

**Payload:**
```json
{ "email": "alice@corp.com", "password": "TempPass123!" }
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "alice@corp.com", "firstName": "Alice", "role": { "id": "...", "name": "Developer" } },
  "mustChangePassword": true
}
```

> If `mustChangePassword: true` → force redirect to change-password screen.

---

### 21.2 Change Password

```
POST /company-users/auth/change-password
```

**Payload:**
```json
{ "newPassword": "MyNew$ecure1!" }
```

---

### 21.3 Create Member (admin only)

```
POST /company-users
```

**Payload:**
```json
{
  "email":     "bob@corp.com",
  "firstName": "Bob",
  "lastName":  "Smith",
  "roleId":    "680role..."
}
```

---

### 21.4 Regenerate Temp Password (admin only)

```
POST /company-users/:id/regenerate-temp-password
```

No body. Sends a new temp password by email.

---

### 21.5 List Members

```
GET /company-users?page=1&limit=50&search=alice
```

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | Default `1` |
| `limit` | number | Default `50` |
| `search` | string | Name/email search |

---

### 21.6–21.8 Get / Update / Delete

```
GET    /company-users/:id         → single member object
PUT    /company-users/:id         → { firstName?, lastName?, roleId? }
DELETE /company-users/:id         → soft delete
```

---

## 22. Roles

All endpoints require auth + admin role.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /roles | Create role |
| 2 | GET | /roles | List roles (company-scoped) |
| 3 | GET | /roles/:id | Get one role |
| 4 | PATCH | /roles/:id | Update role |
| 5 | DELETE | /roles/:id | Delete role |

---

### 22.1 Create Role

```
POST /roles
```

**Payload:**
```json
{
  "name":        "Developer",
  "permissions": ["task:read", "task:write", "team:read"]
}
```

Available permissions:
`task:read` · `task:write` · `task:delete` · `team:read` · `team:manage-members` · `project:read` · `project:write`

---

### 22.2–22.5 List / Get / Update / Delete

```
GET    /roles             → array of { id, name, permissions }
GET    /roles/:id         → single role
PATCH  /roles/:id         → { name?, permissions? }
DELETE /roles/:id         → { message: "Role deleted" }
```

---

## 23. Activity Logs

Requires auth. Admins see all logs; regular users see only their own.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/activity-logs | Get activity logs |

---

### 23.1 Get Activity Logs

```
GET /api/activity-logs
```

**Response:**
```json
[
  {
    "id":        "680log...",
    "userId":    "680abc...",
    "action":    "MEETING_CREATED",
    "entity":    "Meeting",
    "entityId":  "680meet...",
    "details":   "Created meeting: Weekly Sync",
    "createdAt": "2026-03-28T10:00:00.000Z"
  }
]
```

Returns last 100 records, newest first.

---

## 24. Leader Dashboard

For users with "Technical Leader" role. Requires auth.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /leader/teams | My teams |
| 2 | GET | /leader/tasks | Tasks across my teams |
| 3 | GET | /leader/insights | Aggregated insights |
| 4 | GET | /teams/:id/insights | Insights for a specific team |

---

### 24.1 Leader Teams

```
GET /leader/teams
```

**Response:** Array of teams the leader owns/leads.

---

### 24.2 Leader Tasks

```
GET /leader/tasks?page=1&limit=50
```

**Response:**
```json
{
  "data": [...tasks across all leader's teams...],
  "stats": {
    "total": 42, "completed": 30, "inProgress": 8, "todo": 4, "overdue": 2
  },
  "total": 42, "page": 1, "limit": 50
}
```

---

### 24.3 Leader Insights

```
GET /leader/insights
```

**Response:** Aggregated member performance, completion rates, overdue counts across all teams.

---

### 24.4 Team Insights

```
GET /teams/:id/insights
```

**Response:** Insights for a single team — member workloads, task breakdown, velocity.

---

## 25. Analytics

Requires auth. Admins see company-wide data; regular users see personal data.

### Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/analytics/dashboard | Dashboard summary |
| 2 | GET | /api/analytics/tasks | Task analytics |
| 3 | GET | /api/analytics/meetings | Meeting analytics |

---

### 25.1 Dashboard Summary

```
GET /api/analytics/dashboard?from=2026-03-01&to=2026-03-31
```

| Param | Type | Notes |
|-------|------|-------|
| `from` | ISO date string | Optional |
| `to` | ISO date string | Optional |

**Response:**
```json
{
  "tasksCompleted": 30,
  "tasksOverdue": 3,
  "meetingsAttended": 12,
  "productivityScore": 78,
  "activeTeams": 4
}
```

---

### 25.2 Task Analytics

```
GET /api/analytics/tasks
```

**Response:** Task counts by status, priority, overdue breakdown.

---

### 25.3 Meeting Analytics

```
GET /api/analytics/meetings
```

**Response:** Meeting counts by status, total hours, avg duration.

---

## Global Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error — check `message` for field details |
| `401` | Missing or invalid Bearer token → redirect to sign-in |
| `403` | Forbidden — insufficient role/permissions |
| `404` | Resource not found |
| `413` | File too large |
| `500` | Server error |

---

## Axios / Fetch Setup

```tsx
// api.ts — recommended base setup
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const { data } = await axios.post('/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        err.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api.request(err.config);
      }
      // Refresh failed → logout
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```
