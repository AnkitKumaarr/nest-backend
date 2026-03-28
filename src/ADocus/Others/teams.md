# Teams

**Base path:** `/teams`
**Auth:** Required (all endpoints)
**Scope:** Company-scoped

---

## Endpoints

### POST `/teams`

Create a new team.

**Role:** `admin`

**Body:**
```json
{ "name": "Backend Team" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Team created successfully" }
```

---

### GET `/teams`

List all teams for the company (paginated).

**Query:** `?page=1&limit=20`

**Response:**
```json
{
  "teams": [
    {
      "id": "...",
      "name": "Engineering",
      "companyId": "...",
      "createdBy": "...",
      "createdAt": "...",
      "_count": { "teamMembers": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

### GET `/teams/:id`

Get a single team with member count.

**Response:**
```json
{
  "id": "...",
  "name": "Engineering",
  "companyId": "...",
  "createdBy": "...",
  "createdAt": "...",
  "_count": { "teamMembers": 3 }
}
```

---

### PUT `/teams/:id`

Rename a team.

**Role:** `admin`

**Body:**
```json
{ "name": "Platform Engineering" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Team updated successfully" }
```

---

### DELETE `/teams/:id`

Delete a team and all its members.

**Role:** `admin`

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Team deleted successfully" }
```

---

### GET `/teams/:id/insights`

Top performers, task status breakdown, and completion rate for a team.

**Response:**
```json
{
  "teamId": "...",
  "teamName": "Engineering",
  "members": 3,
  "tasks": { "total": 20, "todo": 4, "inProgress": 5, "review": 3, "done": 8 },
  "completionRate": 40,
  "topPerformers": [
    { "id": "...", "name": "Member A", "completedTasks": 5 }
  ]
}
```
