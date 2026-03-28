# Team Members

**Base path:** `/teams/:id/members`
**Auth:** Required (all endpoints)
**Scope:** Company-scoped

---

## TeamMember Fields

| Field | Description |
|---|---|
| `id` | Auto-generated ObjectId |
| `teamId` | ID of the team |
| `teamName` | Name of the team (denormalised) |
| `companyId` | ID of the company |
| `name` | Full name of the member |
| `createdAt` | Timestamp |
| `updatedAt` | Timestamp |

---

## Endpoints

### POST `/teams/:id/members`

Add one or more named members to a team.

**Permission:** `team:manage-members`

**Body:**
```json
{ "members": ["Alice Brown", "Bob Smith", "Carol White"] }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "3 member(s) added to team" }
```

---

### GET `/teams/:id/members`

Get all members of a team.

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "member_record_id",
      "teamId": "team_id",
      "teamName": "Engineering",
      "companyId": "company_id",
      "name": "Alice Brown",
      "createdAt": "2026-03-22T00:00:00.000Z",
      "updatedAt": "2026-03-22T00:00:00.000Z"
    }
  ]
}
```

---

### DELETE `/teams/:id/members/:memberId`

Remove a member from a team by their `TeamMember` record `id`.

**Permission:** `team:manage-members`

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Member removed from team" }
```
