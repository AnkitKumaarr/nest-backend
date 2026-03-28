# Leader Module

**Base paths:** `/leader/*` and `/teams/:id/insights`
**Auth:** Required (all endpoints)

Endpoints for users who are assigned as **Technical Leader** in one or more teams. Results are automatically scoped to the teams where the logged-in user holds the Technical Leader role.

---

## Endpoints

### GET `/leader/teams`
Get only the teams where the current user is a Technical Leader.

**Response:**
```json
[
  {
    "id": "...",
    "name": "Backend Team",
    "companyId": "...",
    "_count": { "teamMembers": 5, "projectTasks": 12 }
  }
]
```

---

### GET `/leader/tasks`
Get all tasks across the leader's teams with per-team progress stats.

**Query:**
```
?page=1&limit=50
```

**Response:**
```json
{
  "tasks": [ { "id": "...", "title": "...", "status": "IN_PROGRESS", "priority": "HIGH", "..." } ],
  "stats": [
    {
      "teamId": "...",
      "total": 20,
      "done": 8,
      "inProgress": 5,
      "review": 3,
      "completionRate": 40
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 20 }
}
```

---

### GET `/leader/insights`
Completion rate, top performers, and per-team breakdown across all leader's teams.

**Response:**
```json
{
  "completionRate": 55,
  "topPerformers": [
    {
      "id": "...",
      "firstName": "Alice",
      "lastName": "Brown",
      "email": "alice@company.com",
      "completedTasks": 9
    }
  ],
  "teamInsights": [
    { "teamId": "...", "total": 20, "done": 11, "completionRate": 55 }
  ]
}
```

---

### GET `/teams/:id/insights`
Insights for a specific team (accessible to any authenticated user with access to that team).

**Params:** `id` — team ID

**Response:**
```json
{
  "teamId": "...",
  "teamName": "Backend Team",
  "members": 6,
  "tasks": { "total": 20, "todo": 4, "inProgress": 5, "review": 3, "done": 8 },
  "completionRate": 40,
  "topPerformers": [
    { "id": "...", "firstName": "Alice", "lastName": "Brown", "completedTasks": 5 }
  ]
}
```
