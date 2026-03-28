# Status — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> Statuses are **global** — seeded once on first company creation.
> `name` is immutable. `label` is the editable display name. `value` = `label.toLowerCase()` (auto-derived).

---

## 1. Get All Statuses

```
GET /status
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    { "id": "sts_1", "name": "Todo",        "label": "Todo",        "value": "todo",        "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "sts_2", "name": "In Progress", "label": "In Progress", "value": "in progress", "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "sts_3", "name": "Completed",   "label": "Completed",   "value": "completed",   "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "sts_4", "name": "Unassigned",  "label": "Unassigned",  "value": "unassigned",  "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "sts_5", "name": "Blocked",     "label": "Blocked",     "value": "blocked",     "isDefault": false, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## 2. Create Status

```
POST /status
```

**Body:**
```json
{ "label": "Blocked" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Status created successfully" }
```

---

## 3. Update Status Label

```
PUT /status
```

**Body:**
```json
{ "id": "sts_id_here", "label": "On Hold" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Status updated successfully" }
```

---

## 4. Delete Status

```
DELETE /status/:id
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Status deleted successfully" }
```

---

## Notes for Frontend

- Use `label` for display text in dropdowns and task cards.
- Use `value` for filtering/comparison logic (`"todo"`, `"in progress"`, etc.).
- Fetch once on app init, cache, re-fetch after create/update/delete.
