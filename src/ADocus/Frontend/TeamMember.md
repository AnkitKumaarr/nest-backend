# Team Members — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## API Summary

| # | Method | Endpoint | Permission | Purpose |
|---|--------|----------|------------|---------|
| 1 | POST | /team-members | `team:manage-members` | Add one or more members to a team |
| 2 | POST | /team-members/list | any auth user | Paginated member list for a team |
| 3 | DELETE | /team-members/:id | `team:manage-members` | Remove a member from a team |

> **Important:** Members are **free-text names** — they do not need a user account in the system.

---

## 1. Add Members

```
POST /team-members
```

**Required permission:** `team:manage-members`

**Body:**
```json
{
  "teamId": "68012abc...",
  "members": ["Alice Brown", "Bob Smith", "Carol White"],
  "createdBy": {
    "userId": "68012abc...",
    "name": "Amit Kapoor"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `teamId` | string | yes | ID of the team to add members to |
| `members` | string[] | yes | Array of member display names (free text, can be empty `[]`) |
| `createdBy.userId` | string | no | Logged-in user's `sub` from token |
| `createdBy.name` | string | no | Logged-in user's display name |

> You can add multiple members in a single request by putting all names in the `members` array.

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": { "message": "3 member(s) added to team" }
}
```

---

## 2. List Members

```
POST /team-members/list
```

**Body:**
```json
{
  "teamId": "68012abc...",
  "page": 1,
  "limit": 25,
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-28"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `teamId` | string | yes | Team whose members to fetch |
| `page` | number | no | Default `1` |
| `limit` | number | no | Default `25` |
| `filters.startDate` | string (ISO 8601) | no | Filter by `createdAt >=` |
| `filters.endDate` | string (ISO 8601) | no | Filter by `createdAt <=` |

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "68099abc...",
        "teamId": "68012abc...",
        "teamName": "Backend Squad",
        "companyId": "67f00abc...",
        "name": "Alice Brown",
        "createdBy": {
          "userId": "68012abc...",
          "name": "Amit Kapoor"
        },
        "createdAt": "2026-03-10T09:00:00.000Z",
        "updatedAt": "2026-03-10T09:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 25,
      "totalRecords": 10
    }
  }
}
```

| Response field | Notes |
|----------------|-------|
| `data.data[].id` | `TeamMember` record ID — use this for the delete endpoint |
| `data.data[].name` | The free-text name entered when adding the member |
| `data.data[].teamName` | Snapshot of the team name at time of adding |
| `meta.totalRecords` | Total members for pagination |

---

## 3. Remove Member

```
DELETE /team-members/:id
```

**Required permission:** `team:manage-members`

**URL param:** `:id` — the `TeamMember.id` from the list response (not the user's ID, not the team's ID)

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Member removed from team" }
}
```

---

## Notes for Frontend

- `members` is an array of **plain name strings** — no user ID or email needed. Great for adding external collaborators.
- Always use `member.id` (the `TeamMember` record ID) for the delete endpoint — not `member.name`.
- `teamId` is required in both the Add and List payloads.
- `createdBy` in the Add body is optional but recommended — pass `{ userId: user.sub, name: user.fullName }` from the token so ownership is tracked.
- Guard **Add** and **Remove** actions behind a `permissions.includes('team:manage-members')` check.
- When a team is deleted, all its members are automatically removed — no need to delete them individually.
- Pagination: `meta.totalRecords / limit` gives total pages.
