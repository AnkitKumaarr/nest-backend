# Weeks Module

**Base path:** `/weeks`
**Auth:** Bearer token required

Generates and stores week slots for a given month/year. Week 1 always starts from the 1st of the month, regardless of what day it falls on. Each week runs Sunday → Saturday. The last week may have fewer than 7 days if the month ends mid-week.

**Example — March 2026 (1st is Sunday):**
| Week | Start | End | Days |
|------|-------|-----|------|
| Week 1 | 01-03-2026 | 07-03-2026 | Sun–Sat (7 days) |
| Week 2 | 08-03-2026 | 14-03-2026 | Sun–Sat (7 days) |
| Week 3 | 15-03-2026 | 21-03-2026 | Sun–Sat (7 days) |
| Week 4 | 22-03-2026 | 28-03-2026 | Sun–Sat (7 days) |
| Week 5 | 29-03-2026 | 31-03-2026 | Sun–Tue (3 days) |

---

## Endpoints

### POST `/weeks`
Generate all weeks for a given month and year. Creates multiple week records automatically.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "month": 3,
  "year": 2026
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| month | number | Yes | 1–12 (1 = January) |
| year  | number | Yes | >= 2000 |

**Response:** Array of created week objects
```json
[
  {
    "id": "...",
    "label": "Week 1",
    "weekNumber": 1,
    "month": "March",
    "year": 2026,
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-03-07T00:00:00.000Z",
    "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "userId": "...",
    "companyId": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "...",
    "label": "Week 5",
    "weekNumber": 5,
    "month": "March",
    "year": 2026,
    "startDate": "2026-03-29T00:00:00.000Z",
    "endDate": "2026-03-31T00:00:00.000Z",
    "days": ["Sunday", "Monday", "Tuesday"],
    "userId": "...",
    "companyId": null
  }
]
```

---

### GET `/weeks`
Get all weeks for the authenticated user (or company if user belongs to one), sorted by year then weekNumber.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same array structure as POST, with `_count.weekTasks` included.

---

### DELETE `/weeks/:weekId`
Delete a specific week by its ID.

**Headers:** `Authorization: Bearer <token>`

**Params:** `weekId` — the `_id` of the week

**Response:** The deleted week object.

**Errors:**
- `404` — Week not found
- `403` — Week belongs to a different user
