# Tawsk Backend — API Endpoints Reference

**Base URL:** `http://localhost:3000/api/v1`  
**Auth:** All endpoints except the Auth module require a Bearer JWT token in the `Authorization` header.

---

## 1. Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/verify-email` | Verify email with OTP |
| POST | `/auth/resend-otp` | Resend verification OTP |
| POST | `/auth/signin` | Login with email & password |
| POST | `/auth/google` | Login / register via Google OAuth |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password using token |
| POST | `/auth/refresh-token` | Refresh JWT access token |
| POST | `/auth/change-password` | Change password (authenticated) |
| GET  | `/auth/me` | Get current authenticated user |

### Payloads

**POST `/auth/signup`**
```json
{
  "email": "user@example.com",
  "password": "string",
  "fullName": "string"
}
```

**POST `/auth/verify-email`**
```json
{ "email": "user@example.com", "otp": "123456" }
```

**POST `/auth/resend-otp`**
```json
{ "email": "user@example.com" }
```

**POST `/auth/signin`**
```json
{ "email": "user@example.com", "password": "string" }
```

**POST `/auth/google`**
```json
{ "idToken": "google_id_token_string" }
```

**POST `/auth/forgot-password`**
```json
{ "email": "user@example.com" }
```

**POST `/auth/reset-password`**
```json
{ "token": "reset_token", "password": "new_password" }
```

**POST `/auth/refresh-token`**
```json
{ "refreshToken": "string" }
```

**POST `/auth/change-password`**
```json
{ "currentPassword": "string", "newPassword": "string" }
```

---

## 2. Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/users` | List all users |
| GET    | `/users/profile` | Get own profile |
| PATCH  | `/users/:userId` | Update user profile |
| DELETE | `/users/profile` | Delete own account |

### Payloads

**PATCH `/users/:userId`**
```json
{
  "fullName": "string",
  "firstName": "string",
  "lastName": "string",
  "avatarUrl": "string",
  "department": "string",
  "location": "string",
  "jobPost": "string",
  "studyAt": "string",
  "about": "string",
  "socialLinks": {}
}
```

---

## 3. Company

> Managed implicitly through Company Users and Roles. No direct CRUD routes exposed for Company; administered via company-users and roles modules.

---

## 4. Company Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/company-users` | List all members of the company |
| POST | `/company-users` | Invite a new member to the company |

### Payloads

**POST `/company-users`**
```json
{
  "email": "member@example.com",
  "firstName": "string",
  "lastName": "string",
  "roleId": "objectId",
  "teamId": "objectId"
}
```

---

## 5. Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/roles` | List all roles in the company |
| POST   | `/roles` | Create a new role |
| GET    | `/roles/:roleId` | Get a specific role |
| PATCH  | `/roles/:roleId` | Update a role |
| DELETE | `/roles/:roleId` | Delete a role |

### Payloads

**POST / PATCH `/roles`**
```json
{
  "name": "string",
  "permissions": ["permission_key_1", "permission_key_2"],
  "isDefault": false
}
```

---

## 6. Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/teams` | List all teams |
| POST   | `/teams` | Create a team |
| GET    | `/teams/:teamId` | Get a specific team |
| GET    | `/teams/:teamId/insights` | Get team performance insights |
| PATCH  | `/teams/:teamId` | Update a team |
| DELETE | `/teams/:teamId` | Delete a team |

### Payloads

**POST / PATCH `/teams`**
```json
{
  "name": "string",
  "managerId": "objectId",
  "leadId": "objectId"
}
```

---

## 7. Team Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/team-members` | List team members (query: `teamId`) |
| GET    | `/team-members/:memberId` | Get a specific team member |
| POST   | `/team-members` | Add a member to a team |
| PATCH  | `/team-members/:memberId` | Update a team member |
| DELETE | `/team-members/:memberId` | Remove a team member |

### Payloads

**POST `/team-members`**
```json
{
  "teamId": "objectId",
  "teamName": "string",
  "userId": "objectId",
  "name": "string",
  "email": "string",
  "role": "string",
  "roleId": "objectId"
}
```

**PATCH `/team-members/:memberId`**
```json
{
  "role": "string",
  "roleId": "objectId",
  "isActive": true
}
```

---

## 8. Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/projects` | List all projects |
| POST   | `/projects` | Create a project |
| GET    | `/projects/:projectId` | Get a specific project |
| PATCH  | `/projects/:projectId` | Update a project |
| DELETE | `/projects/:projectId` | Delete a project |

### Payloads

**POST / PATCH `/projects`**
```json
{
  "name": "string",
  "description": "string",
  "teamId": "objectId"
}
```

---

## 9. Project Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/tasks` | List tasks (query filters apply) |
| POST   | `/tasks` | Create a task |
| GET    | `/tasks/:taskId` | Get a specific task |
| PATCH  | `/tasks/:taskId` | Update a task |
| DELETE | `/tasks/:taskId` | Delete a task |

### Payloads

**POST `/tasks`**
```json
{
  "title": "string",
  "teamId": "objectId",
  "teamName": "string",
  "inChargeId": "objectId",
  "inChargeName": "string",
  "assignedUserId": "objectId",
  "assignDate": "ISO8601",
  "dueDate": "ISO8601",
  "statusId": "string",
  "statusName": "string",
  "priorityId": "string",
  "priorityName": "string",
  "taskContentJson": {},
  "renderedHtml": "string",
  "contentPreview": "string",
  "logTime": "string",
  "position": 1.0
}
```

**PATCH `/tasks/:taskId`** — same fields, all optional.

---

## 10. Comments & Replies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/comments` | List comments for a task |
| POST   | `/comments` | Add a comment to a task |
| PATCH  | `/comments/:commentId` | Update a comment |
| DELETE | `/comments/:commentId` | Delete a comment |
| POST   | `/comments/reply` | Add a reply to a comment |
| PATCH  | `/comments/reply` | Update a reply |
| DELETE | `/comments/reply/:commentId/:replyId` | Delete a reply |

### Query Params

**GET `/comments`**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | Yes | Filter comments by task |
| `page` | number | No | Default: 1 |
| `limit` | number | No | Default: 20 |

### Payloads

**POST `/comments`**
```json
{
  "taskId": "objectId",
  "comment": {},
  "renderedHtml": "string"
}
```

**PATCH `/comments/:commentId`**
```json
{
  "comment": {},
  "renderedHtml": "string"
}
```

**POST `/comments/reply`**
```json
{
  "commentId": "objectId",
  "reply": {},
  "renderedHtml": "string"
}
```

**PATCH `/comments/reply`**
```json
{
  "commentId": "objectId",
  "replyId": "string",
  "reply": {},
  "renderedHtml": "string"
}
```

**DELETE `/comments/reply/:commentId/:replyId`** — no body required.

### Reply object shape (embedded inside comment)
```json
{
  "id": "string",
  "replyBy": { "userId": "objectId", "name": "string" },
  "comment": {},
  "renderedHtml": "string",
  "parentId": "objectId",
  "contentPreview": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

## 11. Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/meetings` | List all meetings |
| GET    | `/meetings/dashboard` | Get meetings dashboard summary |
| GET    | `/meetings/:meetingId` | Get a specific meeting |
| POST   | `/meetings` | Create a meeting |
| PATCH  | `/meetings/:meetingId` | Update a meeting |
| PATCH  | `/meetings/:meetingId/cancel` | Cancel a meeting |
| DELETE | `/meetings/:meetingId` | Delete a meeting |

### Payloads

**POST `/meetings`**
```json
{
  "title": "string",
  "description": "string",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "meetingLink": "string",
  "meetingType": "string",
  "isRecurring": false,
  "recurringDays": [1, 3, 5]
}
```

**PATCH `/meetings/:meetingId/cancel`**
```json
{ "cancellationReason": "string" }
```

---

## 12. Task Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/status` | List all task statuses |
| POST   | `/status` | Create a status |
| GET    | `/status/:statusId` | Get a specific status |
| PATCH  | `/status/:statusId` | Update a status |
| DELETE | `/status/:statusId` | Delete a status |

### Payloads

**POST / PATCH `/status`**
```json
{
  "name": "string",
  "label": "string",
  "value": "string",
  "isDefault": false,
  "order": 1
}
```

---

## 13. Task Priority

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/priority` | List all task priorities |
| POST   | `/priority` | Create a priority |
| GET    | `/priority/:priorityId` | Get a specific priority |
| PATCH  | `/priority/:priorityId` | Update a priority |
| DELETE | `/priority/:priorityId` | Delete a priority |

### Payloads

**POST / PATCH `/priority`**
```json
{
  "name": "string",
  "label": "string",
  "value": "string",
  "isDefault": false
}
```

---

## 14. Weeks (Calendar)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/weeks` | Get weeks for a month (query: `year`, `monthNumber`) |
| POST   | `/weeks` | Create week structure for a month |
| GET    | `/weeks/:weekId` | Get a specific week |
| PATCH  | `/weeks/:weekId` | Update a week |

### Payloads

**POST `/weeks`**
```json
{
  "year": 2025,
  "monthNumber": 5
}
```

---

## 15. Weekly Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/weekly-tasks` | List weekly tasks (query: `weekId`, `dayId`) |
| POST   | `/weekly-tasks` | Create a weekly task |
| GET    | `/weekly-tasks/:weeklyTaskId` | Get a specific weekly task |
| PATCH  | `/weekly-tasks/:weeklyTaskId` | Update a weekly task |
| DELETE | `/weekly-tasks/:weeklyTaskId` | Delete a weekly task |

### Payloads

**POST `/weekly-tasks`**
```json
{
  "weekId": "objectId",
  "parentId": "objectId",
  "title": "string",
  "descriptionHtml": "string",
  "descPreview": "string",
  "startDate": "YYYY-MM-DD",
  "dayId": "objectId",
  "dayDetails": {
    "dayName": "Monday",
    "monthName": "May",
    "monthNumber": 5,
    "year": 2025,
    "date": "ISO8601"
  },
  "dueDate": "YYYY-MM-DD",
  "priority": "medium",
  "status": "todo",
  "blockerHtml": "string",
  "blockerPreview": "string",
  "assignedTo": "string"
}
```

**PATCH `/weekly-tasks/:weeklyTaskId`** — same fields, all optional.

---

## 16. Notifications (Activity Log)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/notifications` | List all notifications for the user |
| PATCH  | `/notifications/read-all` | Mark all notifications as read |
| DELETE | `/notifications` | Clear all notifications |
| PATCH  | `/notifications/:id/read` | Mark one notification as read |
| PATCH  | `/notifications/:id/unread` | Mark one notification as unread |
| DELETE | `/notifications/:id` | Delete a notification |

> No request body needed for PATCH read/unread. No payload for DELETE.

---

## 17. Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/settings` | Get all settings for the user |
| PATCH  | `/settings/notifications` | Update notification preferences |
| PATCH  | `/settings/extensions` | Update extensions settings |
| POST   | `/settings/reset` | Reset settings to defaults |
| PATCH  | `/settings/account/status` | Update account active/inactive status |

### Payloads

**PATCH `/settings/notifications`**
```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "taskUpdates": true,
  "meetingReminders": true
}
```

**PATCH `/settings/extensions`**
```json
{
  "googleCalendar": false,
  "slack": false
}
```

**PATCH `/settings/account/status`**
```json
{ "status": "active" }
```

---

## 18. Device Sessions (Security)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/settings/security/devices` | List all active device sessions |
| DELETE | `/settings/security/devices` | Revoke all other sessions |
| DELETE | `/settings/security/devices/:id` | Revoke a specific session |

> No request body needed.

---

## 19. File Manager

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/file-manager` | List uploaded files |
| POST   | `/file-manager` | Upload one or more files |
| GET    | `/file-manager/:id` | Get file metadata |
| PATCH  | `/file-manager/:id` | Update file metadata |
| DELETE | `/file-manager/bulk` | Delete multiple files |
| DELETE | `/file-manager/:id` | Delete a single file |

### Query Params

**GET `/file-manager`**
| Param | Type | Description |
|-------|------|-------------|
| `folder` | string | Filter by folder |
| `search` | string | Search by file name |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

### Payloads

**POST `/file-manager`** — `multipart/form-data` — accepts 1 to 20 files
```
files:   <binary[]>          (field name must be "files")
folder:  "string"            (optional — applies to all uploaded files)
```
Response:
```json
{
  "data": [
    {
      "id": "objectId",
      "name": "filename.pdf",
      "url": "http://host/uploads/files/uuid.pdf",
      "mimeType": "application/pdf",
      "size": 204800,
      "folder": "string | null",
      "userId": "objectId",
      "createdAt": "ISO8601"
    }
  ],
  "message": "2 file(s) uploaded successfully"
}
```

**PATCH `/file-manager/:id`**
```json
{ "name": "string", "folder": "string" }
```

**DELETE `/file-manager/bulk`**
```json
{ "ids": ["objectId1", "objectId2"] }
```

---

## 20. Analytics Snapshots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics-snapshots` | Get personal analytics snapshot |
| GET | `/analytics-snapshots/overview` | Get company-wide analytics overview |
| GET | `/analytics-snapshots/teams/:teamId` | Get analytics for a specific team |

> Query params may include `scope`, `scopeId`. No request body.

---

## 21. Task Snapshots (Charts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/task-snapshots/status` | Task count by status (personal) |
| GET | `/task-snapshots/priority` | Task count by priority (personal) |
| GET | `/task-snapshots/completion-trend` | Completion trend over time (personal) |
| GET | `/task-snapshots/overdue` | Overdue task summary (personal) |
| GET | `/task-snapshots/team/:teamId/status` | Team task count by status |
| GET | `/task-snapshots/team/:teamId/priority` | Team task count by priority |
| GET | `/task-snapshots/team/:teamId/workload` | Team member workload distribution |
| GET | `/task-snapshots/team/:teamId/completion-trend` | Team completion trend |
| GET | `/task-snapshots/team/:teamId/overdue` | Team overdue summary |
| GET | `/task-snapshots/team/:teamId/productivity` | Team productivity metrics |

---

## 22. Meeting Snapshots (Charts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meeting-snapshots/meeting-status` | Meeting count by status |
| GET | `/meeting-snapshots/duration-trend` | Meeting duration trend |
| GET | `/meeting-snapshots/frequency` | Meeting frequency breakdown |
| GET | `/meeting-snapshots/time-of-day` | Meetings by time of day |

---

## Common Query Parameters

| Param | Used by | Description |
|-------|---------|-------------|
| `companyId` | most list endpoints | Filter by company |
| `teamId` | tasks, team-members, projects | Filter by team |
| `userId` | weekly-tasks, weeks | Filter by user |
| `weekId` | weekly-tasks | Filter by week |
| `dayId` | weekly-tasks | Filter by day |
| `taskId` | comments | Filter by task |
| `folder` | file-manager | Filter files by folder |
| `year` | weeks | Year for calendar |
| `monthNumber` | weeks | Month (1–12) for calendar |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — successful GET / PATCH |
| 201 | Created — successful POST |
| 204 | No Content — successful DELETE |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate (e.g., email already used) |
| 500 | Internal Server Error |
