# Roles — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> Roles are **seeded automatically** when a company is created. Use these endpoints to list, create, or update roles.

---

## 1. Get All Roles

```
GET /roles
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "role_id",
      "name": "Manager",
      "permissions": ["task:create", "task:edit", "team:view"],
      "companyId": "company_id",
      "createdAt": "2026-03-22T00:00:00.000Z"
    }
  ]
}
```

---

## 2. Create Role

> Admin only

```
POST /roles
```

**Body:**
```json
{
  "name": "Custom Role",
  "permissions": ["task:view", "team:view"]
}
```

**Response:**
```json
{ "statusCode": 201, "success": true, "data": { "id": "...", "name": "Custom Role", ... } }
```

---

## 3. Update Role

> Admin only

```
PUT /roles/:id
```

**Body:**
```json
{
  "name": "Custom Role Updated",
  "permissions": ["task:view", "task:create", "team:view"]
}
```

**Response:**
```json
{ "statusCode": 200, "success": true, "data": { "id": "...", "name": "Custom Role Updated", ... } }
```

---

## Notes for Frontend

- Fetch roles on the **Create User** screen to populate the role dropdown.
- The `id` from this list is used as `roleId` when creating or updating a company user.
- Default roles seeded on company creation: `Admin`, `Manager`, `Team Lead`, `Business Analyst`, `Developer`, `QA Engineer`, `Sales Lead`, `HR`, `Employee`, `User`.
