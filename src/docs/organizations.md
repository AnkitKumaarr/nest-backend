# Organizations Module

**Base path:** `/api/organizations`
**Auth:** Required (all endpoints)

An organization is created by a self-registered user (not a company-user). The creator automatically becomes the `admin`.

---

## Endpoints

### POST `/api/organizations`
Create a new organization. The logged-in user becomes admin.

**Body:**
```json
{ "name": "Acme Corp" }
```

**Response:**
```json
{
  "id": "...",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "createdAt": "..."
}
```

---

### GET `/api/organizations/me`
Get the organization the current user belongs to.

**Response:**
```json
{
  "id": "...",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "members": [ { "id": "...", "fullName": "...", "role": "admin" } ]
}
```
