# Weekly Tasks Module

**Base path:** `/weekly-tasks`
**Auth:** Required (all endpoints)

Weekly tasks are entries linked to a **Week** (from the `weeks` collection). Pass the `weekId` from a Week record when creating. Users can only edit/delete their own tasks.

---

## Schema

```
id          String
weekId      String      // ref: weeks.id
title       String?
content     String?
startDate   String?
createdDay  String?
dueDate     String?
priority    String      // default: "medium"
status      String      // default: "todo"
blocker     String?
assignedTo  String?
userId      String
companyId   String?
createdAt   DateTime
updatedAt   DateTime
```

---

## Endpoints

### POST `/weekly-tasks`
Create a weekly task for a given week.

**Body:**
```json
{
  "weekId": "week_id_from_weeks_collection",
  "title": "Auth module",
  "content": "Focus on completing the auth module.",
  "startDate": "2026-03-18",
  "createdDay": "Monday",
  "dueDate": "2026-03-22",
  "priority": "medium",
  "status": "todo",
  "blocker": null,
  "assignedTo": null
}
```

> `weekId` is required. All other fields are optional.

**Response:**
```json
{
  "id": "...",
  "weekId": "...",
  "title": "Auth module",
  "content": "Focus on completing the auth module.",
  "startDate": "2026-03-18",
  "createdDay": "Monday",
  "dueDate": "2026-03-22",
  "priority": "medium",
  "status": "todo",
  "blocker": null,
  "assignedTo": null,
  "userId": "...",
  "companyId": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "week": {
    "id": "...",
    "label": "Week 12",
    "weekNumber": 12,
    "startDate": "...",
    "endDate": "...",
    "month": "March",
    "year": 2026
  }
}
```

---

### POST `/weekly-tasks/list`
List weekly tasks for the current user (or company), with optional filters and pagination.

**Body:**
```json
{
  "weekId": "optional_week_id",
  "monthName": "March",
  "year": 2026,
  "page": 1,
  "limit": 25
}
```

> All fields are optional. Defaults: `page=1`, `limit=25`.

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "priority": "medium",
      "status": "todo",
      "userId": "...",
      "createdAt": "...",
      "week": {
        "id": "...",
        "label": "Week 12",
        "weekNumber": 12,
        "startDate": "...",
        "endDate": "...",
        "month": "March",
        "year": 2026
      }
    }
  ],
  "totalRecords": 10,
  "page": 1,
  "limit": 25,
  "totalPages": 1
}
```

---

### GET `/weekly-tasks/:taskId`
Get a single weekly task by ID.

**Response:** Same shape as the create response.

---

### PUT `/weekly-tasks`
Update a weekly task (only the owner can update). Task ID is sent in the body.

**Body:**
```json
{
  "id": "task_id_to_update",
  "title": "Updated title",
  "content": "Updated content.",
  "startDate": "2026-03-18",
  "createdDay": "Monday",
  "dueDate": "2026-03-22",
  "priority": "high",
  "status": "in_progress",
  "blocker": null,
  "assignedTo": null
}
```

> `id` is required. `weekId` is optional (only include if changing the week). All other fields are optional — only provided fields are updated.

**Response:** Updated task object with the same shape as the create response.

---

### DELETE `/weekly-tasks/:taskId`
Delete a weekly task (only the owner can delete).

**Response:**
```json
{ "message": "Weekly task deleted successfully" }
```
