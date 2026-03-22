# Team Members — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## 1. Add Members

> Requires `team:manage-members` permission.
> Pass an array of member **names** (free text — no user account required).

```
POST /team-members
```

**Body:**
```json
{
  "teamId": "team_id",
  "members": ["Alice Brown", "Bob Smith", "Carol White"]
}
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "3 member(s) added to team" }
```

---

## 2. List Members

```
POST /team-members/list
```

**Body:**
```json
{
  "teamId": "team_id",
  "page": 1,
  "limit": 25,
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-22"
  }
}
```

> `teamId` is required. `page`, `limit`, `filters` are optional.

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
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
    ],
    "meta": { "page": 1, "limit": 25, "totalRecords": 10 }
  }
}
```

---

## 3. Remove Member

> Requires `team:manage-members` permission.
> Use the `id` from the member list (the `TeamMember` record id).

```
DELETE /team-members/:id
```

**URL param:** `:id` — the `id` from the member list (`TeamMember.id`)

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Member removed from team" }
```

---

## Notes for Frontend

- Members are **free-text names** — no login account needed.
- `teamId` is required in both Add and List body payloads.
- Use `id` (not `name`) from the member list for the delete endpoint.
- Guard **Add / Remove** buttons behind `can('team:manage-members')`.
