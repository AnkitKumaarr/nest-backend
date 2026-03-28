# Columns

**Base path:** `/columns`
**Auth:** Required (all endpoints)

---

## Endpoints

### POST `/columns`

Create a new column.

**Body:**
```json
{ "name": "New Column", "teamId": "team_id_here" }
```
`teamId` is optional. If omitted, column is created for the logged-in user.

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Column created successfully" }
```

---

### GET `/columns`

Get all columns for the logged-in user.

**Response:**
```json
[
  { "id": "...", "name": "New Column", "createdAt": "..." }
]
```

---

### GET `/columns/team/:teamId`

Get all columns for a specific team.

**Response:**
```json
[
  { "id": "...", "name": "New Column", "teamId": "...", "createdAt": "..." }
]
```

---

### DELETE `/columns/:id`

Delete a column.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Column deleted successfully" }
```
