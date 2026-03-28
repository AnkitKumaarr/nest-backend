# Teams — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## API Summary

| # | Method | Endpoint | Permission | Purpose |
|---|--------|----------|------------|---------|
| 1 | POST | /teams | admin role | Create a team |
| 2 | POST | /teams/list | any auth user | Paginated team list |
| 3 | GET | /teams/:id | any auth user | Get a single team |
| 4 | PUT | /teams | admin role | Rename a team |
| 5 | DELETE | /teams/:id | admin role | Delete team + all its members |

---

## 1. Create Team

```
POST /teams
```

**Required role:** `admin`

**Body:**
```json
{
  "name": "Backend Squad",
  "createdBy": {
    "userId": "68012abc...",
    "name": "Amit Kapoor"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Team display name |
| `createdBy.userId` | string | no | Logged-in user's `sub` from token |
| `createdBy.name` | string | no | Logged-in user's display name |

> Pass `createdBy` from the decoded JWT — the backend does not auto-populate it.

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": { "message": "Team created successfully" }
}
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
  "teamId": "68012abc...",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-28"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `page` | number | no | Default `1` |
| `limit` | number | no | Default `25` |
| `teamId` | string | no | Filter to a specific team by ID |
| `filters.startDate` | string (ISO 8601) | no | Filter by `createdAt >=` |
| `filters.endDate` | string (ISO 8601) | no | Filter by `createdAt <=` |

> List is scoped to teams created by the logged-in user (`createdBy.userId`).

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "68012abc...",
        "name": "Backend Squad",
        "companyId": "67f00abc...",
        "createdBy": {
          "userId": "68012abc...",
          "name": "Amit Kapoor"
        },
        "createdAt": "2026-03-01T08:00:00.000Z",
        "updatedAt": "2026-03-01T08:00:00.000Z",
        "_count": {
          "teamMembers": 4
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 25,
      "totalRecords": 3
    }
  }
}
```

| Response field | Notes |
|----------------|-------|
| `data.data[]` | Array of team objects |
| `_count.teamMembers` | Number of members — use for badge/avatar count display |
| `meta.totalRecords` | Total teams for pagination |

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
    "id": "68012abc...",
    "name": "Backend Squad",
    "companyId": "67f00abc...",
    "createdBy": {
      "userId": "68012abc...",
      "name": "Amit Kapoor"
    },
    "createdAt": "2026-03-01T08:00:00.000Z",
    "updatedAt": "2026-03-01T08:00:00.000Z",
    "_count": {
      "teamMembers": 4
    }
  }
}
```

---

## 4. Update Team Name

```
PUT /teams
```

**Required role:** `admin`

**Body:**
```json
{
  "id": "68012abc...",
  "name": "Backend Squad v2"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | ID of the team to rename |
| `name` | string | yes | New team name |

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Team updated successfully" }
}
```

---

## 5. Delete Team

```
DELETE /teams/:id
```

**Required role:** `admin`

**URL param:** `:id` — team ID

> Deleting a team **cascade-deletes all its `TeamMember` records**. Warn the user before confirming.

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Team deleted successfully" }
}
```

---

## Notes for Frontend

- `createdBy` is an **object** `{ userId, name }` — not a plain string. Build it from the decoded JWT before sending.
- `_count.teamMembers` comes from the list/get response — no separate request needed to show member count.
- List is filtered to the logged-in user's teams. To load all teams for a company, admin tooling would be needed.
- Store `team.id` — it is required when creating project tasks (`teamId` field) and linking members.
- Guard Create / Rename / Delete buttons behind a `role === 'admin'` check on the frontend.
- Pagination: `data.meta.totalRecords / limit` gives total pages.
