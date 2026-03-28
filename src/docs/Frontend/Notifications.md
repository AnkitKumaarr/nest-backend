# Notifications — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

---

## API Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/notifications | Paginated list with tab counts |
| 2 | PATCH | /api/notifications/read-all | Mark all as read |
| 3 | DELETE | /api/notifications | Delete all notifications |
| 4 | PATCH | /api/notifications/:id/read | Mark one as read |
| 5 | PATCH | /api/notifications/:id/unread | Mark one as unread |
| 6 | DELETE | /api/notifications/:id | Delete one notification |

---

## Notification Type → Tab Mapping

The `type` field stored on each notification determines which tab it appears in.

| Tab id | `type` query param | Matches DB `type` values containing |
|--------|-------------------|--------------------------------------|
| All | `all` (or omit) | every notification |
| Tasks | `tasks` | `TASK_*` e.g. `TASK_ASSIGNED`, `TASK_COMPLETED` |
| Meetings | `meetings` | `MEETING_*` e.g. `MEETING_CREATED`, `MEETING_CANCELLED` |
| System | `system` | `SYSTEM_*` e.g. `SYSTEM_ALERT` |
| Mentions | `mentions` | `MENTION_*` e.g. `MENTION_COMMENT` |

The match is **case-insensitive substring** — any type containing the keyword is included.

---

## 1. Get Notifications (paginated)

```
GET /api/notifications
```

### Query Parameters

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `page` | number | no | `1` | Page number |
| `limit` | number | no | `25` | Items per page |
| `type` | string | no | `all` | `all` \| `tasks` \| `meetings` \| `system` \| `mentions` |
| `read` | boolean | no | — | `true` = read only, `false` = unread only, omit = both |

### Example requests

```
GET /api/notifications                           → all, page 1, limit 25
GET /api/notifications?type=tasks                → task notifications only
GET /api/notifications?type=meetings&read=false  → unread meeting notifications
GET /api/notifications?page=2&limit=25           → page 2
```

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "68012abc...",
        "userId": "68011abc...",
        "title": "Task assigned to you",
        "message": "Rahul assigned \"Fix login bug\" to you",
        "type": "TASK_ASSIGNED",
        "read": false,
        "createdAt": "2026-03-28T10:00:00.000Z"
      },
      {
        "id": "68012abd...",
        "userId": "68011abc...",
        "title": "Meeting cancelled",
        "message": "\"Weekly Sync\" has been cancelled",
        "type": "MEETING_CANCELLED",
        "read": true,
        "createdAt": "2026-03-27T09:30:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 25,
    "counts": {
      "all": 42,
      "tasks": 18,
      "meetings": 11,
      "system": 5,
      "mentions": 8
    }
  }
}
```

### Key fields

| Field | Notes |
|-------|-------|
| `data[]` | Paginated notifications for the active tab |
| `total` | Total notifications matching the current `type` + `read` filter — use for pagination |
| `counts` | Per-tab counts — **always unfiltered by `read`** — plug directly into tab labels |
| `counts.all` | Total number to show next to "All" tab |
| `counts.tasks` | Number to show next to "Tasks" tab |

### Wiring tab labels

```tsx
// After fetching, plug counts directly into tab labels:
const tabs = [
  { id: 'all',      label: `All (${counts.all})` },
  { id: 'tasks',    label: `Tasks (${counts.tasks})` },
  { id: 'meetings', label: `Meetings (${counts.meetings})` },
  { id: 'system',   label: `System (${counts.system})` },
  { id: 'mentions', label: `Mentions (${counts.mentions})` },
];
```

### Pagination example

```tsx
const totalPages = Math.ceil(total / limit);   // use for page controls
const hasMore    = page < totalPages;
```

---

## 2. Mark All as Read

Sets `read: true` on every notification for the logged-in user.

```
PATCH /api/notifications/read-all
```

**Body:** none

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "12 notification(s) marked as read" }
}
```

> Call this when the user clicks "Mark all as read". Re-fetch the list after to update the UI.

---

## 3. Delete All Notifications

Permanently deletes every notification for the logged-in user.

```
DELETE /api/notifications
```

**Body:** none

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "42 notification(s) deleted" }
}
```

> Show a confirmation dialog before calling this — it is irreversible.

---

## 4. Mark One as Read

```
PATCH /api/notifications/:id/read
```

**URL param:** `:id` — notification ID

**Body:** none

**Response:** the updated notification object
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "68012abc...",
    "userId": "68011abc...",
    "title": "Task assigned to you",
    "message": "Rahul assigned \"Fix login bug\" to you",
    "type": "TASK_ASSIGNED",
    "read": true,
    "createdAt": "2026-03-28T10:00:00.000Z"
  }
}
```

---

## 5. Mark One as Unread

```
PATCH /api/notifications/:id/unread
```

**URL param:** `:id` — notification ID

**Body:** none

**Response:** the updated notification object (same shape as above, `read: false`)

---

## 6. Delete One Notification

```
DELETE /api/notifications/:id
```

**URL param:** `:id` — notification ID

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Notification deleted" }
}
```

---

## Frontend Integration Pattern

```tsx
const BASE = '/api/notifications';
const headers = { Authorization: `Bearer ${token}` };

// Fetch on tab change or page change
async function fetchNotifications(type = 'all', page = 1, read?: boolean) {
  const params = new URLSearchParams({ type, page: String(page), limit: '25' });
  if (read !== undefined) params.set('read', String(read));
  const res = await fetch(`${BASE}?${params}`, { headers });
  return res.json();  // { data, total, page, limit, counts }
}

// Mark one read — optimistic update pattern
async function handleMarkRead(id: string) {
  // 1. Update local state immediately
  setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
  );
  // 2. Persist to server
  await fetch(`${BASE}/${id}/read`, { method: 'PATCH', headers });
}

// Mark one unread
async function handleMarkUnread(id: string) {
  setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, read: false } : n))
  );
  await fetch(`${BASE}/${id}/unread`, { method: 'PATCH', headers });
}

// Delete one — remove from local state
async function handleDelete(id: string) {
  setNotifications((prev) => prev.filter((n) => n.id !== id));
  await fetch(`${BASE}/${id}`, { method: 'DELETE', headers });
}

// Mark all read
async function handleMarkAllRead() {
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  await fetch(`${BASE}/read-all`, { method: 'PATCH', headers });
}

// Delete all
async function handleDeleteAll() {
  setNotifications([]);
  await fetch(BASE, { method: 'DELETE', headers });
}
```

---

## Unread Badge Count

To show the unread dot/badge in the nav bar, use:

```
GET /api/notifications?read=false&limit=1
```

The response `total` field gives the unread count without fetching all data.

```tsx
async function fetchUnreadCount() {
  const res = await fetch(`${BASE}?read=false&limit=1`, { headers });
  const json = await res.json();
  return json.data.total;  // e.g. 7
}
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid Bearer token |
| `404` | Notification not found or belongs to another user |
