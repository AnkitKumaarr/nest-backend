# Roles Module

**Base path:** `/roles`
**Auth:** Required · **Role:** `admin` (all endpoints)
**Scope:** Company-scoped. Roles are created per company and assigned to company users.

**Permission string examples:**
```
task:create   task:edit   task:delete   task:*
team:manage-members
weekly:create
```

---

## Endpoints

### POST `/roles`
Create a new role.

**Body:**
```json
{
  "name": "Technical Leader",
  "permissions": ["task:create", "task:edit", "task:delete", "team:manage-members"]
}
```

**Response:**
```json
{
  "id": "...",
  "name": "Technical Leader",
  "permissions": ["task:create", "task:edit"],
  "companyId": "...",
  "createdAt": "..."
}
```

---

### GET `/roles`
List all roles for the company.

**Response:**
```json
[
  { "id": "...", "name": "Staff", "permissions": ["task:create"], "companyId": "..." }
]
```

---

### PUT `/roles/:id`
Update a role's name and permissions.

**Params:** `id`

**Body:**
```json
{
  "name": "Senior Leader",
  "permissions": ["task:create", "task:edit", "task:delete", "team:manage-members"]
}
```
