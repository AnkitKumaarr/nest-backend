# Teams — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## 1. Create Team

> Admin only.

```
POST /teams
```

**Body:**
```json
{ "name": "Engineering" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Team created successfully" }
```

---

## 2. List Teams

```
POST /teams/list
```

**Body:**
```json
{
  "page": 1,
  "limit": 25,
  "teamId": "optional_team_id",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-22"
  }
}
```

> All body fields are optional. Omit any you don't need.

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "team_id",
        "name": "Engineering",
        "companyId": "company_id",
        "createdBy": "user_id",
        "createdAt": "2026-03-22T00:00:00.000Z",
        "updatedAt": "2026-03-22T00:00:00.000Z",
        "_count": { "teamMembers": 3 }
      }
    ],
    "meta": { "page": 1, "limit": 25, "totalRecords": 5 }
  }
}
```

---

## 3. Get Single Team

```
GET /teams/:id
```

**URL param:** `:id` — team ID

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "team_id",
    "name": "Engineering",
    "companyId": "company_id",
    "createdBy": "user_id",
    "createdAt": "...",
    "updatedAt": "...",
    "_count": { "teamMembers": 3 }
  }
}
```

---

## 4. Update Team Name

> Admin only.

```
PUT /teams
```

**Body:**
```json
{ "id": "team_id", "name": "Platform Engineering" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Team updated successfully" }
```

---

## 5. Delete Team

> Admin only. Deletes team and all its members.

```
DELETE /teams/:id
```

**URL param:** `:id` — team ID

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Team deleted successfully" }
```

---

## Notes for Frontend

- List endpoint returns `data.data[]` and `data.meta` — use `meta.totalRecords` for pagination.
- Use `_count.teamMembers` to show member badge on team cards.
- Store `team.id` — it is required when creating project tasks (`teamId` field).
- Guard Create / Rename / Delete behind `role === 'admin'` check.
