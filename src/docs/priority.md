# Priority

**Base path:** `/priority`
**Auth:** Required (all endpoints)

---

## Endpoints

### POST `/priority`

Create a custom priority label.

**Body:**
```json
{ "priority": "high" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Priority created successfully" }
```

---

### GET `/priority`

Get priority list for the logged-in user.

**Response:**
```json
[
  {
    "id": "...",
    "priority": "high",
    "createdAt": "...",
    "userId": "..."
  }
]
```

---

### PUT `/priority`

Update a priority label.

**Body:**
```json
{ "id": "priority_id_here", "priority": "medium" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Priority updated successfully" }
```

---

### DELETE `/priority/:id`

Delete a priority label.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Priority deleted successfully" }
```
