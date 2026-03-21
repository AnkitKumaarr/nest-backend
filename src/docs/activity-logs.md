# Activity Logs Module

**Base path:** `/api/activity-logs`
**Auth:** Required

Activity logs are created automatically by the system on key events. Admins can see all logs; regular users see only their own.

---

## Endpoints

### GET `/api/activity-logs`
Get activity logs.

**Auth:** Required
**Body:** None

**Response:**
```json
[
  {
    "id": "...",
    "action": "TASK_CREATED",
    "entity": "Task",
    "entityId": "...",
    "details": "Created task 'Implement login page'",
    "createdAt": "...",
    "user": { "id": "...", "fullName": "John Doe" }
  }
]
```

**Tracked actions:**
```
USER_LOGIN  USER_SIGNUP_INITIATED  EMAIL_VERIFIED
PASSWORD_RESET_REQUEST  PASSWORD_CHANGED  TOKEN_REFRESHED
TASK_CREATED  TASK_UPDATED  TASK_DELETED
MEETING_CREATED  MEETING_UPDATED  MEETING_CANCELLED  MEETING_DELETED  MEETING_JOINED
ORG_CREATED
```
