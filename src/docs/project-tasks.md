# Project Tasks Module

**Base path:** `/tasks`
**Auth:** Required (all endpoints)
**Scope:** Company + team scoped.

**Priority values:** `LOW` · `MEDIUM` · `HIGH`
**Status values:** `TODO` · `IN_PROGRESS` · `REVIEW` · `DONE`

---

## Endpoints

### POST `/tasks`
Create a project task.

**Permission:** `task:create`

**Body:**
```json
{
  "title": "Implement login page",
  "teamId": "team_id_here",
  "inchargeId": "user_id_here",
  "priority": "HIGH",
  "status": "TODO",
  "logTime": 4,
  "taskContent": { "type": "doc", "content": [] },
  "dueDate": "2026-04-01T00:00:00.000Z"
}
```

Required: `title`, `teamId`
Optional: `inchargeId`, `priority`, `status`, `logTime`, `taskContent`, `dueDate`

---

### GET `/tasks`
List tasks filtered by team and/or status.

**Query:**
```
?teamId=...&status=IN_PROGRESS&page=1&limit=50
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "...",
      "title": "Implement login page",
      "status": "TODO",
      "priority": "HIGH",
      "inchargeId": "...",
      "dueDate": "...",
      "createdAt": "...",
      "_count": { "comments": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 18 }
}
```

---

### GET `/tasks/:id`
Get a single task with all comments.

---

### PUT `/tasks/:id`
Update a task. Only the creator or users with `task:edit` permission can update.

**Body:** (all optional)
```json
{
  "title": "Updated title",
  "inchargeId": "user_id",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "logTime": 6,
  "taskContent": {},
  "dueDate": "2026-04-15T00:00:00.000Z"
}
```

---

### DELETE `/tasks/:id`
Delete a task. Only the creator or users with `task:delete` permission can delete.

---

### POST `/tasks/:taskId/comments`
Add a comment to a task.

**Body:**
```json
{ "comment": "Blocked by auth issue." }
```

**Response:**
```json
{
  "id": "...",
  "taskId": "...",
  "userId": "...",
  "username": "Alice Brown",
  "comment": "Blocked by auth issue.",
  "createdAt": "..."
}
```

---

### GET `/tasks/:taskId/comments`
List all comments on a task (paginated).

**Query:**
```
?page=1&limit=20
```
