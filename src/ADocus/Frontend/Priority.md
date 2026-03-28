# Priority — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> Priorities are **global** — seeded once on first company creation.
> `name` is immutable. `label` is the editable display name. `value` = `label.toLowerCase()` (auto-derived).

---

## 1. Get All Priorities

```
GET /priority
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    { "id": "pri_1", "name": "Urgent",     "label": "Urgent",     "value": "urgent",     "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "pri_2", "name": "High",       "label": "High",       "value": "high",       "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "pri_3", "name": "Medium",     "label": "Medium",     "value": "medium",     "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "pri_4", "name": "Low",        "label": "Low",        "value": "low",        "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "pri_5", "name": "Unassigned", "label": "Unassigned", "value": "unassigned", "isDefault": true,  "createdAt": "...", "updatedAt": "..." },
    { "id": "pri_6", "name": "Critical",   "label": "Critical",   "value": "critical",   "isDefault": false, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## 2. Create Priority

```
POST /priority
```

**Body:**
```json
{ "label": "Critical" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Priority created successfully" }
```

---

## 3. Update Priority Label

```
PUT /priority
```

**Body:**
```json
{ "id": "pri_id_here", "label": "Very High" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Priority updated successfully" }
```

---

## 4. Delete Priority

```
DELETE /priority/:id
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Priority deleted successfully" }
```

---

## Notes for Frontend

- Use `label` for display text in dropdowns and task cards.
- Use `value` for filtering/sorting logic (`"urgent"`, `"high"`, etc.).
- Recommended display order: Urgent → High → Medium → Low → Unassigned.
- Fetch once on app init, cache, re-fetch after create/update/delete.
