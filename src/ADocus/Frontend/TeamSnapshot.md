# Team Snapshot — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## Overview

The Team Snapshot API returns **pre-aggregated, chart-ready data** for rendering team dashboards and analytics panels.

All snapshots are stored in the `TeamSnapshot` collection and **automatically refreshed** whenever:
- A team is created, renamed, or deleted
- A member is added or removed from the team

No polling or manual refresh is required on the frontend.

---

## How Snapshots Work

```
Team created / member added or removed
        ↓ (automatic, background)
All 6 snapshots recomputed and stored in team_snapshot collection
        ↓
GET /api/team-snapshot/team/:teamId/* → returns stored snapshot instantly
```

If a snapshot does not exist yet (very first request for a team), it is computed live on demand, stored, and returned.

---

## API Summary

| # | Endpoint | Chart Type | What it shows |
|---|----------|------------|---------------|
| 1 | `GET /api/team-snapshot/team/:teamId` | — | All 6 charts in one response |
| 2 | `GET /api/team-snapshot/team/:teamId/member-count` | stat | Total member count |
| 3 | `GET /api/team-snapshot/team/:teamId/task-status` | bar | Tasks by status |
| 4 | `GET /api/team-snapshot/team/:teamId/task-priority` | pie | Tasks by priority |
| 5 | `GET /api/team-snapshot/team/:teamId/workload` | bar | Open tasks per member |
| 6 | `GET /api/team-snapshot/team/:teamId/completion-trend` | line | Completed tasks/day — last 30 days |
| 7 | `GET /api/team-snapshot/team/:teamId/member-growth` | line | Members added/day — last 30 days |

---

## Standard Response Shape

Every individual chart endpoint returns this shape:

```json
{
  "id": "68012abc...",
  "key": "team_task_status_68012abc...",
  "title": "Team Task Status",
  "type": "task_status",
  "teamId": "68012abc...",
  "chartType": "bar",
  "data": {
    "labels": [...],
    "datasets": [{ "label": "...", "data": [...] }]
  },
  "isActive": true,
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

The `data` object (`labels` + `datasets`) is directly compatible with **Chart.js**, **Recharts**, and **Nivo**.

---

## 1. Get All Snapshots (Recommended)

Fetches all 6 chart snapshots in a single request. Use this on the initial team dashboard load.

```
GET /api/team-snapshot/team/:teamId
```

**Response:** object keyed by `type`

```json
{
  "member_count": {
    "type": "member_count",
    "title": "Team Member Count",
    "chartType": "stat",
    "data": { "total": 8 }
  },
  "task_status": {
    "type": "task_status",
    "title": "Team Task Status",
    "chartType": "bar",
    "data": {
      "labels": ["TODO", "IN_PROGRESS", "COMPLETED"],
      "datasets": [{ "label": "Tasks", "data": [12, 5, 30] }]
    }
  },
  "task_priority": {
    "type": "task_priority",
    "title": "Team Task Priority Breakdown",
    "chartType": "pie",
    "data": {
      "labels": ["HIGH", "MEDIUM", "LOW"],
      "datasets": [{ "label": "Tasks by Priority", "data": [8, 24, 15] }]
    }
  },
  "workload": {
    "type": "workload",
    "title": "Team Workload Distribution",
    "chartType": "bar",
    "data": {
      "labels": ["Amit Kapoor", "Rahul Singh", "Sneha Patel"],
      "datasets": [{ "label": "Open Tasks", "data": [7, 12, 4] }]
    }
  },
  "completion_trend": {
    "type": "completion_trend",
    "title": "Team Completion Trend (Last 30 Days)",
    "chartType": "line",
    "data": {
      "labels": ["2026-03-01", "2026-03-02", "2026-03-05"],
      "datasets": [{ "label": "Completed Tasks", "data": [3, 5, 2] }]
    }
  },
  "member_growth": {
    "type": "member_growth",
    "title": "Team Member Growth (Last 30 Days)",
    "chartType": "line",
    "data": {
      "labels": ["2026-03-01", "2026-03-10", "2026-03-20"],
      "datasets": [{ "label": "Members Added", "data": [2, 3, 3] }]
    }
  }
}
```

> **Tip:** Call this once on mount and distribute the results to each chart component. Avoids 6 separate network requests.

---

## 2. Member Count

KPI stat card — total number of members in the team.

```
GET /api/team-snapshot/team/:teamId/member-count
```

**Response:**
```json
{
  "type": "member_count",
  "title": "Team Member Count",
  "chartType": "stat",
  "data": { "total": 8 }
}
```

**Use case:** Summary card at the top of the team page — "8 Members".

---

## 3. Task Status Distribution

Bar chart — how many tasks are in each status bucket for this team.

```
GET /api/team-snapshot/team/:teamId/task-status
```

**Response:**
```json
{
  "type": "task_status",
  "title": "Team Task Status",
  "chartType": "bar",
  "data": {
    "labels": ["TODO", "IN_PROGRESS", "COMPLETED"],
    "datasets": [{ "label": "Tasks", "data": [12, 5, 30] }]
  }
}
```

**Use case:** Main status bar chart on the team overview panel.

---

## 4. Task Priority Breakdown

Pie chart — how tasks are distributed across priority levels.

```
GET /api/team-snapshot/team/:teamId/task-priority
```

**Response:**
```json
{
  "type": "task_priority",
  "title": "Team Task Priority Breakdown",
  "chartType": "pie",
  "data": {
    "labels": ["HIGH", "MEDIUM", "LOW"],
    "datasets": [{ "label": "Tasks by Priority", "data": [8, 24, 15] }]
  }
}
```

**Use case:** Pie/doughnut chart next to the status bar chart for a quick priority health check.

---

## 5. Workload Distribution

Bar chart — number of **open** tasks currently assigned to each team member by name.

```
GET /api/team-snapshot/team/:teamId/workload
```

**Response:**
```json
{
  "type": "workload",
  "title": "Team Workload Distribution",
  "chartType": "bar",
  "data": {
    "labels": ["Amit Kapoor", "Rahul Singh", "Sneha Patel", "Unassigned"],
    "datasets": [{ "label": "Open Tasks", "data": [7, 12, 4, 3] }]
  }
}
```

**Use case:** Horizontal bar chart to spot overloaded members. Highlight bars where count is above team average.

---

## 6. Completion Trend

Line chart — number of tasks completed per day over the **last 30 days**.

```
GET /api/team-snapshot/team/:teamId/completion-trend
```

**Response:**
```json
{
  "type": "completion_trend",
  "title": "Team Completion Trend (Last 30 Days)",
  "chartType": "line",
  "data": {
    "labels": ["2026-03-01", "2026-03-02", "2026-03-05", "2026-03-06"],
    "datasets": [{ "label": "Completed Tasks", "data": [3, 5, 2, 8] }]
  }
}
```

> Labels only include days where at least one task was completed — no zero-padding. Fill gaps to zero on the frontend if needed for a continuous line.

**Use case:** Area/line chart showing team velocity over time.

---

## 7. Member Growth

Line chart — number of members **added** per day over the **last 30 days**.

```
GET /api/team-snapshot/team/:teamId/member-growth
```

**Response:**
```json
{
  "type": "member_growth",
  "title": "Team Member Growth (Last 30 Days)",
  "chartType": "line",
  "data": {
    "labels": ["2026-03-01", "2026-03-10", "2026-03-20"],
    "datasets": [{ "label": "Members Added", "data": [2, 3, 3] }]
  }
}
```

**Use case:** Small sparkline showing team growth momentum alongside the member count stat card.

---

## Recharts Integration Example

```jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function TeamWorkloadChart({ teamId, token }) {
  const [visual, setVisual] = useState(null);

  useEffect(() => {
    fetch(`/api/team-snapshot/team/${teamId}/workload`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => setVisual(res.data));
  }, [teamId]);

  if (!visual) return null;

  const chartData = visual.data.labels.map((label, i) => ({
    name: label,
    tasks: visual.data.datasets[0].data[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip />
        <Legend />
        <Bar dataKey="tasks" name="Open Tasks" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## Load All Snapshots on Mount (Recommended Pattern)

```jsx
import { useEffect, useState } from 'react';

function TeamDashboard({ teamId, token }) {
  const [snapshots, setSnapshots] = useState(null);

  useEffect(() => {
    fetch(`/api/team-snapshot/team/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => setSnapshots(res.data));
  }, [teamId]);

  if (!snapshots) return <Spinner />;

  return (
    <div>
      {/* KPI card */}
      <StatCard label="Members" value={snapshots.member_count.data.total} />

      {/* Charts — data is plug-and-play */}
      <BarChart data={snapshots.task_status.data} title={snapshots.task_status.title} />
      <PieChart data={snapshots.task_priority.data} title={snapshots.task_priority.title} />
      <BarChart data={snapshots.workload.data} title={snapshots.workload.title} horizontal />
      <LineChart data={snapshots.completion_trend.data} title={snapshots.completion_trend.title} />
      <LineChart data={snapshots.member_growth.data} title={snapshots.member_growth.title} />
    </div>
  );
}
```

---

## Suggested Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Team: Backend Squad                                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 8 Members│  │47 Tasks  │  │ 30 Done  │  ← stat cards│
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────┐         │
│  │  Task Status (bar)  │  │  Priority (pie)  │         │
│  └─────────────────────┘  └──────────────────┘         │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  Workload per Member (horizontal bar)        │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │  Completion Trend  │  │  Member Growth     │        │
│  │  (line, 30d)       │  │  (line, 30d)       │        │
│  └────────────────────┘  └────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Recommended Chart Types Per Snapshot

| Snapshot type | Recommended component | Notes |
|---|---|---|
| `member_count` | Stat / KPI card | Just render `data.total` as a number |
| `task_status` | `<BarChart>` | Vertical bars per status |
| `task_priority` | `<PieChart>` or `<RadialBarChart>` | Color-code HIGH=red, MEDIUM=amber, LOW=green |
| `workload` | `<BarChart layout="vertical">` | Horizontal bars, sorted by count desc |
| `completion_trend` | `<LineChart>` or `<AreaChart>` | Fill zeros for missing days for a smooth line |
| `member_growth` | `<LineChart>` (sparkline) | Small chart next to member count card |

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid Bearer token |
| `404` | Team not found |
| `500` | Server error during aggregation |
