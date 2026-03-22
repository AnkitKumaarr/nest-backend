# Status

**Base path:** `/status`
**Auth:** Required (all endpoints)

---

## Endpoints

### POST `/status`

Create a custom status label.

**Body:**
```json
{ "status": "In Progress" }
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Status created successfully" }
```

---

### GET `/status`

Get status list for the logged-in user.

**Response:**
```json
[
  {
    "id": "...",
    "status": "In Progress",
    "createdAt": "...",
    "userId": "..."
  }
]
```

---

### PUT `/status`

Update a status label.

**Body:**
```json
{ "id": "status_id_here", "status": "Completed" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Status updated successfully" }
```

---

### DELETE `/status/:id`

Delete a status label.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Status deleted successfully" }
```
