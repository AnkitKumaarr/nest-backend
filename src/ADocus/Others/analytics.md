# Analytics Module

**Base path:** `/api/analytics`
**Auth:** Required (all endpoints)

---

## Endpoints

### GET `/api/analytics/dashboard`
Dashboard summary — task counts, meeting counts, recent activity.

**Query:**
```
?from=2026-01-01&to=2026-03-31
```

Both `from` and `to` are optional date filters.

---

### GET `/api/analytics/tasks`
Task analytics — priority breakdown, overdue count, status distribution.

---

### GET `/api/analytics/meetings`
Meeting analytics — hours logged, status distribution.

---

### GET `/api/analytics/admin/user-activity`
User activity feed.

**Role:** `admin`
