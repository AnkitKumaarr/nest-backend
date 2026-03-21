# Users Module

**Base path:** `/users`
**Auth:** None (internal/admin use — no guards applied)

Manages the base `User` records (self-registered users, not company-users). Typically used for internal operations or admin tooling.

---

## Endpoints

### POST `/users`
Create a user directly (bypasses signup OTP flow).

**Body:**
```json
{
  "email": "user@example.com",
  "passwordHash": "alreadyHashedPassword",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "role": "user",
  "department": "Engineering",
  "status": "active"
}
```

Required: `email`, `passwordHash`
Optional: `lastName`, `avatarUrl`, `role`, `department`, `status`

---

### GET `/users`
Get all users.

**Response:**
```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "role": "user",
    "status": "active"
  }
]
```

---

### GET `/users/:id`
Get a single user by ID.

**Params:** `id`

---

### PATCH `/users/:id`
Partially update a user.

**Params:** `id`

**Body:** (all optional)
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "role": "admin",
  "department": "Design",
  "status": "inactive"
}
```

---

### DELETE `/users/:id`
Delete a user by ID.

**Params:** `id`
