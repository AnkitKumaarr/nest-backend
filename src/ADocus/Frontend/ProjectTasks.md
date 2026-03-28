# Project Tasks — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## 1. Create Task

> Requires `task:create` permission.

```
POST /project-tasks
```

**Body:**
```json
{
  "title": "Implement login page",
  "teamId": "team_id_here",
  "columnId": "col_id_here",
  "userId": "assigned_user_id",
  "inchargeId": "incharge_user_id",
  "priority": "HIGH",
  "status": "TODO",
  "logTime": "2h 30mins",
  "taskContent": { "type": "doc", "content": [] },
  "dueDate": "2026-04-01T00:00:00.000Z",
  "assignDate": "2026-03-25T00:00:00.000Z"
}
```

**Required fields:** `title`, `teamId`
**Optional fields:** `columnId`, `userId`, `inchargeId`, `priority`, `status`, `logTime`, `taskContent`, `dueDate`, `assignDate`

**Priority values:** `LOW` · `MEDIUM` · `HIGH`
**Status values:** `TODO` · `IN_PROGRESS` · `REVIEW` · `DONE`

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Task created successfully" }
```

---

## 2. List / Filter Tasks

> Use this to load the task board. All filters are optional.

```
POST /project-tasks/list
```

**Body:**
```json
{
  "teamId": "69bf1d843bea4d0dd6b1ac64",
  "taskId": "specific_task_id",
  "status": "IN_PROGRESS",
  "page": 1,
  "limit": 50,
  "filters": [
    {
      "type": "date",
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-30T23:59:59.999Z"
    },
    {
      "type": "users",
      "userId": ["68a1b2c3d4e5f6a7b8c9d0e1", "68a1b2c3d4e5f6a7b8c9d0e2"]
    }
  ]
}
```

| Field     | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `teamId`  | string | No       | Filter by team                    |
| `taskId`  | string | No       | Fetch a specific task             |
| `status`  | string | No       | Filter by status value            |
| `page`    | number | No       | Default `1`                       |
| `limit`   | number | No       | Default `50`                      |
| `filters` | array  | No       | Array of filter objects (see below)|

**Filter types:**

| `type`  | Fields                          | Description                                    |
|---------|---------------------------------|------------------------------------------------|
| `date`  | `startDate`, `endDate`          | Returns tasks where `createdAt` falls in range |
| `users` | `userId` (array of user IDs)    | Returns tasks assigned to any of those users   |

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_id",
        "title": "Implement login page",
        "teamId": "...",
        "columnId": "...",
        "columnName": "In Progress",
        "assignedUserId": "...",
        "inchargeId": "...",
        "inchargeName": "Amit Shah",
        "creatorId": "...",
        "creatorName": "Rahul Verma",
        "priority": "HIGH",
        "status": "TODO",
        "logTime": "2h 30mins",
        "dueDate": "2026-04-01T00:00:00.000Z",
        "assignDate": "2026-03-25T00:00:00.000Z",
        "createdAt": "...",
        "_count": { "comments": 3 }
      }
    ],
    "meta": { "page": 1, "limit": 50, "total": 24 }
  }
}
```

---

## 3. Get Single Task

> Loads full task with all nested top-level comments and their replies.

```
GET /project-tasks/:id
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "task_id",
    "title": "Implement login page",
    "teamId": "...",
    "columnId": "...",
    "assignedUserId": "...",
    "inchargeId": "...",
    "creatorId": "...",
    "priority": "HIGH",
    "status": "TODO",
    "logTime": 4,
    "taskContent": { "type": "doc", "content": [] },
    "dueDate": "2026-04-01T00:00:00.000Z",
    "createdAt": "...",
    "comments": [
      {
        "id": "comment_id",
        "userId": "...",
        "username": "Alice Brown",
        "comment": "Blocked by auth issue.",
        "parentId": null,
        "createdAt": "...",
        "replies": [
          {
            "id": "reply_id",
            "userId": "...",
            "username": "Bob Smith",
            "comment": "Looking into it now.",
            "parentId": "comment_id",
            "createdAt": "..."
          }
        ]
      }
    ]
  }
}
```

---

## 4. Update Task

> Only the task creator or users with `task:edit` permission can update.

```
PUT /project-tasks
```

**Body (`taskId` is required, rest optional):**
```json
{
  "taskId": "task_id_here",
  "title": "Updated title",
  "inchargeId": "user_id",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "logTime": "2h 30mins",
  "taskContent": { "type": "doc", "content": [] },
  "dueDate": "2026-04-15T00:00:00.000Z"
}
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Task updated successfully" }
```

---

## 5. Delete Task

> Only the task creator or users with `task:delete` permission can delete.

```
DELETE /project-tasks/:id
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Task deleted successfully" }
```

---

## Notes for Frontend

### Kanban Board Flow
1. Call `GET /columns` or `GET /columns/team/:teamId` to load board columns.
2. Call `POST /project-tasks/list` with `teamId` to load all tasks.
3. Group tasks by `columnId` to render each column lane.
4. On drag-drop between columns, call `PUT /project-tasks` with `{ taskId, columnId: newColumnId }`.

### Task Detail Screen
1. Call `GET /project-tasks/:id` for full task data.
2. Call `POST /comments/list` with `{ taskId, page: 1, limit: 20 }` for paginated comments.

### Pre-load Required
Before the Create Task form, fetch and cache:
- `GET /columns` or `GET /columns/team/:teamId` → for column dropdown
- `GET /priority` → for priority dropdown
- `GET /status` → for status dropdown
- `GET /teams/:id/members` → for assignee / incharge dropdowns
