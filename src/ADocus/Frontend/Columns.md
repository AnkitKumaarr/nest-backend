# Columns — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> Columns are **global** — seeded once on first company creation.
> `name` is immutable. `label` is the editable display name. `value` = `label.toLowerCase()` (auto-derived).

---

## 1. Get All Columns

```
GET /columns
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    { "id": "col_1", "name": "TODO",         "label": "TODO",         "value": "todo",         "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_2", "name": "INPROGRESS",   "label": "INPROGRESS",   "value": "inprogress",   "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_3", "name": "SELF TESTING", "label": "SELF TESTING", "value": "self testing", "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_4", "name": "BLOCKER",      "label": "BLOCKER",      "value": "blocker",      "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_5", "name": "QA READY",     "label": "QA READY",     "value": "qa ready",     "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_6", "name": "DONE",         "label": "DONE",         "value": "done",         "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "col_7", "name": "REVIEW",       "label": "Review",       "value": "review",       "isDefault": false, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## 2. Create Column

```
POST /columns
```

**Body:**
```json
{ "label": "REVIEW" }
```

> `name` and `value` are auto-set from `label`. `isDefault` is always `false` for user-created columns.

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Column created successfully" }
```

---

## 3. Update Column Label

> Only `label` (and the derived `value`) are updated. `name` is never changed.

```
PUT /columns
```

**Body:**
```json
{ "id": "col_id_here", "label": "In Review" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Column updated successfully" }
```

---

## 4. Delete Column

```
DELETE /columns/:id
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Column deleted successfully" }
```

---

## Notes for Frontend

- Use `id` as `columnId` when creating/updating a project task.
- Use `label` for display, `value` for filtering/comparison logic.
- Disable the **rename** input for items where `isDefault: true` if you want to honour the immutable-name rule in the UI (the API only protects `name`, not `label`).
- Fetch once on app init, cache, re-fetch after create/update/delete.
