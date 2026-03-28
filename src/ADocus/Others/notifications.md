# Notifications Module

**Base path:** `/api/notifications`
**Auth:** Required (all endpoints)

Notifications are user-scoped and created automatically by the system on events (task assignment, meeting invite, etc.).

---

## Endpoints

### GET `/api/notifications`
Get all notifications for the current user.

**Response:**
```json
[
  {
    "id": "...",
    "title": "New task assigned",
    "message": "You have been assigned to 'Implement login page'",
    "type": "TASK_ASSIGNED",
    "read": false,
    "createdAt": "..."
  }
]
```

---

### PUT `/api/notifications/:id/read`
Mark a notification as read.

**Params:** `id`
**Body:** None

---

### DELETE `/api/notifications/:id`
Delete a notification.

**Params:** `id`
