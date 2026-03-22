# Project Tasks

**Base path:** `/project-tasks`
**Auth:** Required (all endpoints)
**Scope:** Company + team scoped

**Priority values:** `LOW` · `MEDIUM` · `HIGH`
**Status values:** `TODO` · `IN_PROGRESS` · `REVIEW` · `DONE`

---

## Endpoints

### POST `/project-tasks`

Create a project task.

**Permission:** `task:create`

**Body:**

```json
{
  "title": "Implement login page",
  "teamId": "team_id_here",
  "columnId": "column_id_here",
  "userId": "user_id_here",
  "inchargeId": "user_id_here",
  "priority": "HIGH",
  "status": "TODO",
  "logTime": 4,
  "taskContent": { "type": "doc", "content": [] },
  "dueDate": "2026-04-01T00:00:00.000Z",
  "assignDate": "2026-04-01T00:00:00.000Z"
}
```

Required: `title`, `teamId`, `taskContent`, `columnId`, `userId`
Optional: `inchargeId`, `priority`, `status`, `logTime`, `dueDate`, `assignDate`

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Task created successfully" }
```

---

### POST `/project-tasks/list`

List tasks with optional filters.

**Body:**

```json
{
  "teamId": "team_id_here",
  "taskId": "task_id_here",
  "status": "IN_PROGRESS",
  "page": 1,
  "limit": 50,
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.999Z",
  "userId": "user_id_here"
}
```

All fields optional. Defaults: `page=1`, `limit=50`.

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

### GET `/project-tasks/:id`

Get a single task with all comments.

**Response:** Full task object with nested comments.

---

### PUT `/project-tasks`

Update a task. Only the creator or users with `task:edit` permission can update.

**Body:** (all optional except `taskId`)

```json
{
  "taskId": "task_id_here",
  "title": "Updated title",
  "inchargeId": "user_id",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "logTime": 6,
  "taskContent": {},
  "dueDate": "2026-04-15T00:00:00.000Z"
}
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Task updated successfully" }
```

---

### DELETE `/project-tasks/:id`

Delete a task. Only the creator or users with `task:delete` permission can delete.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Task deleted successfully" }
```
