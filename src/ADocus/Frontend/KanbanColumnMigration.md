# Kanban Board — Column → Status Migration

## Overview

Columns have been removed entirely. The Kanban board now renders columns directly from the **Status** collection. Each status represents a column on the board.

---

## Default Statuses (Board Columns)

| Order | Name        | Value       |
|-------|-------------|-------------|
| 1     | Backlog     | backlog     |
| 2     | Todo        | todo        |
| 3     | In Progress | in progress |
| 4     | Completed   | completed   |

**Backlog is always the first column** (order = 1). New custom statuses are appended after the defaults.

These are seeded automatically on company creation and cannot be deleted or modified (they are marked `isDefault: true`). Custom statuses can be added via `POST /status`.

---

## What Changed

### Removed
- `Column` Prisma model — deleted from schema
- `ColumnsModule` — entire `src/columns/` directory deleted
- `ColumnsModule` import from `AppModule`
- `columnId` and `columnName` fields from `ProjectTask` schema
- `columnId` field from `CreateProjectTaskDto`
- `columnId` field from `UpdateTaskDto`
- `DEFAULT_COLUMNS` constant from `defaults.constants.ts`
- Column seeding in `CompaniesService.seedGlobals()`
- `column:create` and `column:delete` permissions from Manager and Team Lead roles

### Updated
- `DEFAULT_STATUSES` — replaced `Unassigned` with `Backlog` (order: Backlog, Todo, In Progress, Completed)
- `ProjectTasksService.create()` — position calculation now groups by `statusId` instead of `columnId`
- `ProjectTasksService.update()` — removed column name resolution block

---

## API Changes

### Creating a Task
Pass `statusId` to place the task in the correct column.

```json
POST /project-tasks
{
  "title": "Fix login bug",
  "teamId": "<teamId>",
  "statusId": "<statusId>"   // ← determines which column it appears in
}
```

### Fetching Statuses (for rendering columns)
```
GET /status
```
Returns all statuses ordered by `createdAt`. Use these to render Kanban columns on the frontend.

### Moving a Task Between Columns
Update the `statusId`:

```json
PUT /project-tasks
{
  "taskId": "<taskId>",
  "statusId": "<newStatusId>"
}
```

---

## Frontend Rendering Logic

```
GET /status  →  renders N columns (one per status)
GET /project-tasks/list  →  fetch tasks, group by statusId to populate columns
```

Each task's `statusId` / `statusName` determines which column it belongs to.

---

## Migration Notes

- Existing tasks that had a `columnId` will no longer reference columns. Ensure tasks have a valid `statusId` set.
- The `Column` collection in MongoDB can be dropped safely — it is no longer referenced by any model.
