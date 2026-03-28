# Meeting Visuals — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## Overview

The Meeting Visuals API returns **chart-ready snapshots** for rendering meeting analytics dashboards.

- **Individual mode** — meetings where the logged-in user is creator or participant (userId from JWT)
- **Company mode** — all meetings across an entire company

Snapshots are **automatically refreshed** whenever a meeting is created, updated, deleted, or a participant joins. No polling needed.

---

## How Snapshots Work

```
Meeting created / updated / deleted / participant joined
        ↓ (automatic, background)
MeetingVisual snapshot recomputed and stored in meeting_visuals collection
        ↓
GET /api/meeting-visuals/* → returns stored snapshot instantly
```

If no snapshot exists yet (first request), it is computed live and stored.

---

## Response Shape (all endpoints)

```json
{
  "title": "Company Meeting Status",
  "type": "meeting_status",
  "mode": "company",
  "companyId": "<companyId>",
  "chartType": "doughnut",
  "data": {
    "labels": ["scheduled", "completed", "cancelled"],
    "datasets": [{ "data": [8, 22, 3] }]
  },
  "isActive": true,
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

---

## Individual Endpoints

> Uses logged-in user's ID from the JWT token automatically.

---

### 1. Meeting Status Distribution

```
GET /api/meeting-visuals/individual/meeting-status
```

**Chart type:** `doughnut`

**Example response:**
```json
{
  "title": "My Meeting Status",
  "type": "meeting_status",
  "mode": "individual",
  "chartType": "doughnut",
  "data": {
    "labels": ["scheduled", "completed", "cancelled"],
    "datasets": [{ "data": [3, 10, 1] }]
  }
}
```

**Use case:** Personal meeting overview widget showing breakdown by status.

---

### 2. Meeting Duration Trend

```
GET /api/meeting-visuals/individual/duration-trend
```

**Chart type:** `line`

Shows **average meeting duration (minutes) per day** over the last 30 days.

**Example response:**
```json
{
  "title": "My Meeting Duration Trend",
  "type": "duration_trend",
  "mode": "individual",
  "chartType": "line",
  "data": {
    "labels": ["2026-03-01", "2026-03-05", "2026-03-10"],
    "datasets": [{ "label": "Avg Duration (mins)", "data": [45, 60, 30] }]
  }
}
```

**Use case:** Detect if meetings are trending longer over time.

---

### 3. Meeting Frequency

```
GET /api/meeting-visuals/individual/frequency
```

**Chart type:** `bar`

Shows **number of meetings per day** over the last 30 days.

**Example response:**
```json
{
  "title": "My Meeting Frequency",
  "type": "frequency",
  "mode": "individual",
  "chartType": "bar",
  "data": {
    "labels": ["2026-03-22", "2026-03-23", "2026-03-24"],
    "datasets": [{ "label": "Meetings", "data": [2, 1, 3] }]
  }
}
```

**Use case:** Calendar heatmap or bar chart showing busy meeting days.

---

### 4. Meetings by Time of Day

```
GET /api/meeting-visuals/individual/time-of-day
```

**Chart type:** `bar`

Buckets: `Morning (6–12)` · `Afternoon (12–17)` · `Evening (17–22)` · `Night (22–6)`

**Example response:**
```json
{
  "title": "My Meetings by Time of Day",
  "type": "time_of_day",
  "mode": "individual",
  "chartType": "bar",
  "data": {
    "labels": ["Morning (6–12)", "Afternoon (12–17)", "Evening (17–22)", "Night (22–6)"],
    "datasets": [{ "label": "Meetings", "data": [4, 9, 2, 0] }]
  }
}
```

**Use case:** Show when the user tends to have the most meetings.

---

## Company Endpoints

> Replace `:companyId` with the actual company ObjectId.

---

### 5. Company Meeting Status

```
GET /api/meeting-visuals/company/:companyId/meeting-status
```

**Chart type:** `doughnut`

**Example response:**
```json
{
  "title": "Company Meeting Status",
  "type": "meeting_status",
  "mode": "company",
  "chartType": "doughnut",
  "data": {
    "labels": ["scheduled", "completed", "cancelled"],
    "datasets": [{ "data": [8, 22, 3] }]
  }
}
```

---

### 6. Company Duration Trend

```
GET /api/meeting-visuals/company/:companyId/duration-trend
```

**Chart type:** `line`

Average meeting duration per day across the entire company — last 30 days.

---

### 7. Company Meeting Frequency

```
GET /api/meeting-visuals/company/:companyId/frequency
```

**Chart type:** `bar`

Number of meetings held per day across the company — last 30 days.

---

### 8. Participant Engagement

```
GET /api/meeting-visuals/company/:companyId/participant-engagement
```

**Chart type:** `bar`

Groups meetings by participant count range.

**Example response:**
```json
{
  "title": "Meetings by Participant Count",
  "type": "participant_engagement",
  "mode": "company",
  "chartType": "bar",
  "data": {
    "labels": ["1–3", "4–6", "7–10", "10+"],
    "datasets": [{ "label": "Number of Meetings", "data": [12, 18, 5, 2] }]
  }
}
```

**Use case:** Understand whether most meetings are small focused sessions or large all-hands.

---

### 9. Meetings by Time of Day (Company)

```
GET /api/meeting-visuals/company/:companyId/time-of-day
```

**Chart type:** `bar`

Same slot bucketing as individual — across all company meetings.

---

### 10. Recurring vs One-Time

```
GET /api/meeting-visuals/company/:companyId/recurring-ratio
```

**Chart type:** `doughnut`

**Example response:**
```json
{
  "title": "Recurring vs One-Time Meetings",
  "type": "recurring_ratio",
  "mode": "company",
  "chartType": "doughnut",
  "data": {
    "labels": ["Recurring", "One-Time"],
    "datasets": [{ "data": [14, 19] }]
  }
}
```

**Use case:** Show what proportion of company meetings are recurring.

---

## Recommended Chart Types

| Endpoint                  | Recommended Chart     |
|---------------------------|-----------------------|
| `meeting-status`          | Doughnut              |
| `duration-trend`          | Line                  |
| `frequency`               | Bar / Calendar        |
| `participant-engagement`  | Horizontal Bar        |
| `time-of-day`             | Bar                   |
| `recurring-ratio`         | Doughnut / Pie        |
