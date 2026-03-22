# Projects — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## 1. Create Project

```
POST /projects
```

**Body:**
```json
{
  "name": "TaskForge App",
  "description": "Main product development project"
}
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Project created successfully" }
```

---

## 2. List Projects

```
POST /projects/list
```

**Body:**
```json
{
  "page": 1,
  "limit": 25,
  "userId": "optional_user_id",
  "teamId": "optional_team_id",
  "teamMemberId": "optional_team_member_id",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-22"
  }
}
```

> All fields optional. `userId` filters by `createdBy.userId`.

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "project_id",
        "name": "TaskForge App",
        "description": "Main product development project",
        "companyId": "company_id",
        "teamId": null,
        "createdBy": {
          "userId": "user_id",
          "name": "Amit Kapoor"
        },
        "createdAt": "2026-03-22T00:00:00.000Z",
        "updatedAt": "2026-03-22T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 25, "totalRecords": 3 }
  }
}
```

---

## 3. Update Project

```
PUT /projects
```

**Body:**
```json
{
  "id": "project_id",
  "name": "TaskForge App v2",
  "description": "Updated description"
}
```

> `name` and `description` are optional — send only what you want to change.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Project updated successfully" }
```

---

## 4. Delete Project

```
DELETE /projects/:id
```

**URL param:** `:id` — project ID

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Project deleted successfully" }
```

---

## Notes for Frontend

- `createdBy` is auto-populated from the logged-in user's token — do not send it in the body.
- Use `project.id` when linking tasks to a project.
- List returns `data.data[]` and `data.meta` — use `meta.totalRecords` for pagination.
