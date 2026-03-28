# Meetings Dashboard — API Requirements

Base URL: `/api`
Auth header required on every request: `Authorization: Bearer <token>`

---

## Tabs in Meetings Dashboard

| Tab | What it shows |
|-----|---------------|
| Overview | Summary cards, next meeting countdown, attendance streak, earned badges |
| List | Full meetings table with search, status filter, date range, and all CRUD actions |
| Visuals | Bar chart (frequency), pie chart (duration split), line chart (participation trend) |

---

## Overview Tab

### 1. Get Meeting Analytics

Used for the four summary cards: Total, Upcoming, Completed, Average Duration.

Method: GET
Endpoint: `/api/meetings/analytics`

Query params: none

Response:
```
totalMeetings        number
upcomingMeetings     number
completedMeetings    number
averageDuration      number   (in minutes)
attendanceStreak     number
onTimeAttendance     number   (percentage, 0 to 100)
```

---

### 2. Get Next Upcoming Meeting

Used to power the countdown card (days / hours / minutes / seconds until the meeting starts).
Also drives the Join, Reschedule, and Cancel action buttons on that card.

Method: GET
Endpoint: `/api/meetings/next`

Query params: none

Response:
```
id                   string
title                string
description          string
startTime            string   (ISO 8601)
endTime              string   (ISO 8601)
meetingLink          string
isRecurring          boolean
participants         array
  id                 string
  name               string
  email              string
  avatar             string   (URL or null)
  status             string   (Accepted / Declined / Pending / Tentative)
```

---

### 3. Get Attendance Streak

Used for the Streak card showing current and longest attendance streak.

Method: GET
Endpoint: `/api/meetings/streak`

Query params: none

Response:
```
current              number
longest              number
type                 string   (attendance or punctuality)
```

---

### 4. Get User Badges

Used for the Achievements section. Only earned badges are displayed. Unearned badges are hidden.

Method: GET
Endpoint: `/api/meetings/badges`

Query params: none

Response: array of
```
id                   string
title                string
description          string
icon                 string   (emoji or icon identifier)
earned               boolean
earnedAt             string   (ISO 8601, only present when earned is true)
```

---

## List Tab

### 5. Get Meetings List

Powers the main data table. Called on mount and re-called on every filter or search change.

Method: GET
Endpoint: `/api/meetings`

Query params:
```
status               string   optional — All / Upcoming / Ongoing / Completed / Canceled
search               string   optional — filters by title or description
startDate            string   optional — ISO 8601, start of custom date range
endDate              string   optional — ISO 8601, end of custom date range
page                 number   optional — default 1
limit                number   optional — default 20
```

Response:
```
data                 array of meeting objects
  id                 string
  title              string
  description        string
  startTime          string   (ISO 8601)
  endTime            string   (ISO 8601)
  status             string   (Upcoming / Ongoing / Completed / Canceled)
  isRecurring        boolean
  meetingLink        string
  createdBy          string
  createdAt          string
  updatedAt          string
  participants       array
    id               string
    name             string
    email            string
    avatar           string
    status           string   (Accepted / Declined / Pending / Tentative)
total                number
page                 number
limit                number
```

---

### 6. Create Meeting

Called on Create Meeting modal form submit.

Method: POST
Endpoint: `/api/meetings`

Request body:
```
title                string   required
description          string   optional, defaults to empty string
meetingLink          string   optional
startTime            string   required, ISO 8601
endTime              string   required, ISO 8601
participantIds       array    required, can be empty array, each item is a user id string
isRecurring          boolean  required
recurringDays        array    required only when isRecurring is true
                              each item is a number — 0 Sunday through 6 Saturday
meetingType          string   google_meet / zoom / teams / other
```

Response: the newly created meeting object (same shape as one item in the List response)

---

### 7. Update Meeting

Called on Edit Meeting modal form submit.

Method: PATCH
Endpoint: `/api/meetings/:id`

Request body: same fields as Create — all are optional, send only what changed:
```
title                string   optional
description          string   optional
meetingLink          string   optional
startTime            string   optional, ISO 8601
endTime              string   optional, ISO 8601
participantIds       array    optional
isRecurring          boolean  optional
recurringDays        array    optional
meetingType          string   optional
```

Response: the updated meeting object

---

### 8. Cancel Meeting

Called after user confirms the Cancel action in the table row menu.
Backend should set status to Canceled and notify participants.

Method: PATCH
Endpoint: `/api/meetings/:id/cancel`

Request body:
```
reason               string   optional cancellation reason
```

Response:
```
id                   string
status               string   (Canceled)
updatedAt            string
```

---

### 9. Delete Meeting

Called after user confirms the Delete action in the table row menu.
Permanently removes the meeting record.

Method: DELETE
Endpoint: `/api/meetings/:id`

Request body: none

Response:
```
message              string   e.g. "Meeting deleted successfully"
```

---

### 10. Get Available Participants

Called when the Create or Edit Meeting modal opens, to populate the participants multi-select dropdown.

Method: GET
Endpoint: `/api/users/participants`

Query params:
```
search               string   optional, filter by name or email
limit                number   optional, default 50
```

Response: array of
```
id                   string
name                 string
email                string
avatar               string   (URL or null)
initials             string   e.g. "OH" for Oliver Hansen
```

---

## Visuals Tab

All three chart endpoints accept the same optional date range params.
They can optionally be merged into a single charts endpoint to save round trips.

Common query params for all three:
```
startDate            string   optional, ISO 8601, defaults to last 30 days
endDate              string   optional, ISO 8601
```

---

### 11. Meetings Per Day (Bar Chart)

Method: GET
Endpoint: `/api/meetings/analytics/per-day`

Response: array of
```
date                 string   ISO 8601 or day label e.g. "Mon"
count                number
```

---

### 12. Meeting Duration Distribution (Pie Chart)

Groups meetings into Short (30 min or less), Medium (30 to 60 min), and Long (over 60 min).

Method: GET
Endpoint: `/api/meetings/analytics/duration`

Response: array of
```
label                string   e.g. "Short (≤30 min)"
value                number   count of meetings in this category
color                string   hex color for the slice
```

---

### 13. Participation Trend (Line Chart)

Shows average number of participants per meeting over time.
Frontend uses this to calculate trend direction (up / down / stable) and peak participation.

Method: GET
Endpoint: `/api/meetings/analytics/participation-trend`

Query params (in addition to the common date range):
```
groupBy              string   optional — day or week, default week
```

Response: array of
```
date                 string   ISO 8601
averageParticipants  number
```

---

## Full API Summary

| # | Method | Endpoint | Tab | Purpose |
|---|--------|----------|-----|---------|
| 1 | GET | /api/meetings/analytics | Overview | Summary cards (total, upcoming, completed, avg duration) |
| 2 | GET | /api/meetings/next | Overview | Next meeting countdown card |
| 3 | GET | /api/meetings/streak | Overview | Streak card |
| 4 | GET | /api/meetings/badges | Overview | Achievements / earned badges |
| 5 | GET | /api/meetings | List | Meetings table with filters and pagination |
| 6 | POST | /api/meetings | List | Create a new meeting |
| 7 | PATCH | /api/meetings/:id | List | Update / edit a meeting |
| 8 | PATCH | /api/meetings/:id/cancel | List | Cancel a meeting |
| 9 | DELETE | /api/meetings/:id | List | Delete a meeting |
| 10 | GET | /api/users/participants | List (modal) | Participants dropdown for create / edit |
| 11 | GET | /api/meetings/analytics/per-day | Visuals | Bar chart — meetings per day |
| 12 | GET | /api/meetings/analytics/duration | Visuals | Pie chart — duration distribution |
| 13 | GET | /api/meetings/analytics/participation-trend | Visuals | Line chart — participation over time |

Total: 13 API calls across 3 tabs.

---

## Notes

- APIs 11, 12, and 13 share the same date range filter. Consider combining them into a single endpoint returning all three datasets at once to reduce round trips on the Visuals tab.
- `recurringDays` uses numeric indices: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
- All datetime fields must be ISO 8601 strings in UTC. The frontend converts to local time for display.
- Participant invitation status (Accepted / Declined / Pending / Tentative) is read-only from the meetings API and is managed through a separate RSVP or invite flow.
- APIs 1, 3, and 4 could be combined into a single `/api/meetings/overview` endpoint since they are all fetched together when the Overview tab loads.
