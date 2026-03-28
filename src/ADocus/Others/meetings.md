# Meetings Module

**Base path:** `/api/meetings`
**Auth:** Required (all endpoints)

**Status values:** `scheduled` · `ongoing` · `completed` · `cancelled`

---

## Endpoints

### POST `/api/meetings`
Create a meeting.

**Body:**
```json
{
  "title": "Sprint Planning",
  "description": "Plan the upcoming sprint",
  "startTime": "2026-03-22T10:00:00.000Z",
  "endTime": "2026-03-22T11:00:00.000Z",
  "meetingLink": "https://meet.google.com/...",
  "status": "scheduled",
  "isRecurring": false
}
```

Required: `title`, `startTime`, `endTime`, `status`
Optional: `description`, `meetingLink`, `isRecurring`

---

### GET `/api/meetings`
Get all meetings for the current user.

---

### GET `/api/meetings/:id`
Get a meeting by ID.

---

### PUT `/api/meetings/:id`
Update a meeting.

**Body:** Any meeting fields to update.

---

### DELETE `/api/meetings/:id`
Delete a meeting.

---

### POST `/api/meetings/:id/join`
Join a meeting as a participant.

**Body:** None
