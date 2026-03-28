# Task Visuals — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## Overview

The Task Visuals API returns **chart-ready data** for rendering dashboards.

- **Individual mode** — data scoped to the logged-in user (read from JWT token automatically)
- **Team mode** — data scoped to a specific team by `teamId`

Responses are pre-aggregated snapshots stored in the database.
They are **automatically refreshed** whenever a task is created, updated, or deleted — no polling needed.

---

## How Snapshots Work

```
Task created / updated / deleted
        ↓ (automatic, background)
Snapshot recomputed and stored in task_visuals collection
        ↓
GET /api/task-visuals/* → returns stored snapshot instantly
```

If a snapshot does not exist yet (first request), it is computed live and stored for future requests.

---

## Query Parameters (all optional)

All endpoints accept these optional filters via query string:

| Param       | Type     | Values                                      | Description                              |
|-------------|----------|---------------------------------------------|------------------------------------------|
| `dateRange` | string   | `weekly` \| `monthly` \| `yearly` \| `custom` | Pre-defined date windows              |
| `from`      | ISO date | `2026-01-01`                                | Start date (use with `dateRange=custom`) |
| `to`        | ISO date | `2026-03-31`                                | End date (use with `dateRange=custom`)   |
| `priority`  | string   | `HIGH,MEDIUM,LOW`                           | Comma-separated priority filter          |
| `status`    | string   | `TODO,IN_PROGRESS,COMPLETED`                | Comma-separated status filter            |

> **Note:** Requests **without filters** return the stored snapshot (fast).
> Requests **with filters** are computed live on demand (not stored).

---

## Response Shape (all endpoints)

```json
{
  "title": "Team Task Status Overview",
  "type": "task_status",
  "mode": "team",
  "teamId": "<teamId>",
  "chartType": "bar",
  "data": {
    "labels": ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
    "datasets": [
      {
        "label": "Team Tasks",
        "data": [12, 5, 30, 3]
      }
    ]
  },
  "isActive": true,
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

The `data` object is directly compatible with **Chart.js**, **Recharts**, and **Highcharts**.

---

## Individual Endpoints

> These use the logged-in user's ID from the JWT token. No `userId` param needed.

---

### 1. Task Status Distribution

```
GET /api/task-visuals/individual/task-status
```

**Chart type:** `doughnut`

**Example response:**
```json
{
  "title": "My Task Status Overview",
  "type": "task_status",
  "mode": "individual",
  "chartType": "doughnut",
  "data": {
    "labels": ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
    "datasets": [{ "data": [12, 8, 20, 3] }]
  }
}
```

**Use case:** Show user's own task breakdown by status on personal dashboard.

---

### 2. Priority Breakdown

```
GET /api/task-visuals/individual/priority
```

**Chart type:** `pie`

**Example response:**
```json
{
  "title": "My Task Priority Breakdown",
  "type": "priority",
  "mode": "individual",
  "chartType": "pie",
  "data": {
    "labels": ["HIGH", "MEDIUM", "LOW"],
    "datasets": [{ "data": [5, 18, 10] }]
  }
}
```

**Use case:** Show distribution of tasks by priority level for the logged-in user.

---

### 3. Completion Trend

```
GET /api/task-visuals/individual/completion-trend
```

**Chart type:** `line`

Defaults to the last **7 days** if no `dateRange` is provided.

**Example response:**
```json
{
  "title": "My Completion Trend",
  "type": "completion_trend",
  "mode": "individual",
  "chartType": "line",
  "data": {
    "labels": ["2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26"],
    "datasets": [{ "label": "Completed Tasks", "data": [2, 5, 3, 6, 4] }]
  }
}
```

**Use case:** Line chart showing daily task completions. Great for a "streak" widget.

---

### 4. Overdue Tasks

```
GET /api/task-visuals/individual/overdue
```

**Chart type:** `bar`

**Example response:**
```json
{
  "title": "My Overdue Tasks",
  "type": "overdue",
  "mode": "individual",
  "chartType": "bar",
  "data": {
    "labels": ["HIGH", "MEDIUM"],
    "datasets": [{ "label": "Overdue Tasks", "data": [2, 1] }]
  },
  "total": 3
}
```

**Use case:** Alert widget or bar chart showing overdue tasks grouped by priority.

---

## Team Endpoints

> Replace `:teamId` with the actual team ObjectId.

---

### 5. Team Task Status

```
GET /api/task-visuals/team/:teamId/task-status
```

**Chart type:** `bar`

**Example response:**
```json
{
  "title": "Team Task Status Overview",
  "type": "task_status",
  "mode": "team",
  "teamId": "660abcde987654321abc0002",
  "chartType": "bar",
  "data": {
    "labels": ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
    "datasets": [{ "label": "Team Tasks", "data": [35, 18, 60, 7] }]
  }
}
```

**Use case:** Team overview bar chart showing all tasks by status.

---

### 6. Team Priority Breakdown

```
GET /api/task-visuals/team/:teamId/priority
```

**Chart type:** `pie`

**Example response:**
```json
{
  "title": "Team Task Priority Breakdown",
  "type": "priority",
  "mode": "team",
  "chartType": "pie",
  "data": {
    "labels": ["HIGH", "MEDIUM", "LOW"],
    "datasets": [{ "label": "Tasks by Priority", "data": [20, 45, 15] }]
  }
}
```

---

### 7. Team Workload

```
GET /api/task-visuals/team/:teamId/workload
```

**Chart type:** `stacked_bar`

**Example response:**
```json
{
  "title": "Team Workload Distribution",
  "type": "workload",
  "mode": "team",
  "chartType": "stacked_bar",
  "data": {
    "labels": ["Amit", "Rahul", "Sneha", "Priya"],
    "datasets": [{ "label": "Assigned Tasks", "data": [12, 18, 9, 14] }]
  }
}
```

**Use case:** Show which team members have the most tasks assigned. Useful for load balancing.

---

### 8. Team Completion Trend

```
GET /api/task-visuals/team/:teamId/completion-trend
```

**Chart type:** `line`

Defaults to the last **7 days** if no `dateRange` is provided.

**Example response:**
```json
{
  "title": "Team Completion Trend",
  "type": "completion_trend",
  "mode": "team",
  "chartType": "line",
  "data": {
    "labels": ["2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26"],
    "datasets": [{ "label": "Completed Tasks", "data": [8, 12, 6, 15, 10] }]
  }
}
```

---

### 9. Team Overdue Tasks

```
GET /api/task-visuals/team/:teamId/overdue
```

**Chart type:** `bar`

**Example response:**
```json
{
  "title": "Team Overdue Tasks",
  "type": "overdue",
  "mode": "team",
  "chartType": "bar",
  "data": {
    "labels": ["HIGH", "MEDIUM", "LOW"],
    "datasets": [{ "label": "Overdue Tasks", "data": [5, 8, 2] }]
  },
  "total": 15
}
```

**Use case:** Show a warning card on the team dashboard when `total > 0`.

---

### 10. Team Productivity

```
GET /api/task-visuals/team/:teamId/productivity
```

**Chart type:** `bar`

**Example response:**
```json
{
  "title": "Team Productivity",
  "type": "productivity",
  "mode": "team",
  "chartType": "bar",
  "data": {
    "labels": ["Rahul", "Sneha", "Amit", "Priya"],
    "datasets": [{ "label": "Completed Tasks", "data": [22, 18, 15, 10] }]
  }
}
```

**Use case:** Leaderboard-style bar chart ranked by completed task count.

---

## Filter Examples

### Weekly data only

```
GET /api/task-visuals/team/:teamId/task-status?dateRange=weekly
```

### Monthly, high priority only

```
GET /api/task-visuals/team/:teamId/priority?dateRange=monthly&priority=HIGH
```

### Custom date range

```
GET /api/task-visuals/team/:teamId/completion-trend?dateRange=custom&from=2026-01-01&to=2026-03-31
```

### Filter by specific statuses

```
GET /api/task-visuals/individual/task-status?status=TODO,IN_PROGRESS
```

---

## Chart.js Integration Example

```js
import { Chart } from 'chart.js';

async function renderTeamTaskStatus(teamId, token) {
  const res = await fetch(`/api/task-visuals/team/${teamId}/task-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const visual = await res.json();

  new Chart(document.getElementById('myChart'), {
    type: visual.chartType,         // "bar"
    data: visual.data,              // { labels, datasets } — plug in directly
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: visual.title },
      },
    },
  });
}
```

---

## Recharts Integration Example

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function TeamProductivityChart({ teamId, token }) {
  const [visual, setVisual] = useState(null);

  useEffect(() => {
    fetch(`/api/task-visuals/team/${teamId}/productivity`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setVisual);
  }, [teamId]);

  if (!visual) return null;

  // Transform chart-ready data into Recharts format
  const data = visual.data.labels.map((label, i) => ({
    name: label,
    count: visual.data.datasets[0].data[i],
  }));

  return (
    <BarChart width={500} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" name={visual.data.datasets[0].label} fill="#6366f1" />
    </BarChart>
  );
}
```

---

## Recommended Chart Types Per Visual

| Endpoint             | Recommended Chart     | Library key              |
|----------------------|-----------------------|--------------------------|
| `task-status`        | Doughnut / Bar        | `doughnut` / `bar`       |
| `priority`           | Pie                   | `pie`                    |
| `workload`           | Stacked Bar           | `bar` (stacked)          |
| `completion-trend`   | Line / Area           | `line`                   |
| `overdue`            | Bar + Alert badge     | `bar`                    |
| `productivity`       | Horizontal Bar        | `bar` (indexAxis: 'y')   |

---

## Error Responses

| Status | Meaning                        |
|--------|--------------------------------|
| `401`  | Missing or invalid Bearer token |
| `404`  | Team not found / no data yet   |
| `500`  | Server error during aggregation |
