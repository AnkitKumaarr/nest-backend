# Teams Module

**Base path:** `/teams`
**Auth:** Required (all endpoints)
**Scope:** Company-scoped.

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
{
  "id": "...",
  "name": "Backend Team",
  "companyId": "...",
  "createdBy": "...",
  "createdAt": "..."
}
```

---

### GET `/teams`
List all teams (paginated).

**Query:**
```
?page=1&limit=20
```

---

### GET `/teams/:id`
Get a single team with member count.

---

### PUT `/teams/:id`
Rename a team.

**Role:** `admin`

**Body:**
```json
{ "name": "Frontend Team" }
```

---

### DELETE `/teams/:id`
Delete a team and all its members.

**Role:** `admin`

---

### POST `/teams/:id/members`
Add members to a team. `roleInTeam` is auto-assigned from their company role.

**Permission:** `team:manage-members`

**Body:**
```json
{ "userIds": ["userId1", "userId2"] }
```

**Response:**
```json
{ "message": "2 member(s) added to team" }
```

---

### GET `/teams/:id/members`
Get all members of a team.

**Response:**
```json
[
  {
    "id": "...",
    "teamId": "...",
    "userId": "...",
    "firstName": "Alice",
    "lastName": "Brown",
    "roleInTeam": "Technical Leader"
  }
]
```

---

### DELETE `/teams/:id/members/:userId`
Remove a member from a team.

**Permission:** `team:manage-members`

---

### GET `/teams/:id/insights`
Top performers, task status breakdown, completion rate for a team.

**Response:**
```json
{
  "teamId": "...",
  "teamName": "Backend Team",
  "members": 6,
  "tasks": { "total": 20, "todo": 4, "inProgress": 5, "review": 3, "done": 8 },
  "completionRate": 40,
  "topPerformers": [
    { "id": "...", "firstName": "Alice", "lastName": "Brown", "completedTasks": 5 }
  ]
}
```
