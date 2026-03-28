# Legacy Tasks Module

**Base path:** `/api/tasks`
**Auth:** Required (all endpoints)

Original per-user task system. Not team-based. Separate from the Project Tasks module (`/tasks`).

**Status values:** `todo` · `inProgress` · `completed`
**Priority values:** `low` · `medium` · `high`

---

## Endpoints

### POST `/api/tasks`
Create a personal task.

**Body:**
```json
{
  "title": "Review PR",
  "description": "Review the auth PR",
  "date": "17-03-2026",
  "dueDate": "20-03-2026",
  "priority": "high",
  "status": "todo",
  "blocker": "Waiting for review",
  "assignedToId": "userId",
  "groupId": "groupId"
}
```

Required: `title`
Optional: `description`, `date` (DD-MM-YYYY), `dueDate` (DD-MM-YYYY), `priority`, `status`, `blocker`, `assignedToId`, `groupId`

---

### GET `/api/tasks`
Get tasks with optional filters.

**Query:**
```
?status=todo&priority=high&page=1&limit=20
```

---

### GET `/api/tasks/:id`
Get a task by ID.

---

### POST `/api/tasks/update`
Update a task.

**Body:**
```json
{
  "taskId": "required_task_id",
  "title": "Updated title",
  "status": "inProgress",
  "priority": "medium"
}
```

`taskId` is required. All other fields are optional.

---

### DELETE `/api/tasks/delete/:taskId`
Delete a task.

**Params:** `taskId`
