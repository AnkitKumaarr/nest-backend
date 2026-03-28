# Company Users Module

**Base path:** `/company-users`
**Scope:** Company-scoped. Admin creates users; users receive a temp password via email.

> On first login with temp password → response includes `requirePasswordChange: true`.

---

## Endpoints

### POST `/company-users/auth/signin`
Company user sign in (temp or regular password).

**Auth:** None

**Body:**
```json
{
  "email": "staff@company.com",
  "password": "tempOrRegularPassword"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "requirePasswordChange": true,
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "Jane",
    "lastName": "Smith",
    "companyId": "...",
    "role": "Technical Leader",
    "permissions": ["task:create", "task:edit"]
  }
}
```

---

### POST `/company-users/auth/change-password`
Change password after first temp login.

**Auth:** Required

**Body:**
```json
{ "newPassword": "newSecure123" }
```

---

### POST `/company-users`
Create a company user (sends temp password email).

**Auth:** Required · **Role:** `admin`

**Body:**
```json
{
  "email": "newstaff@company.com",
  "firstName": "Alice",
  "lastName": "Brown",
  "roleId": "role_id_here"
}
```

---

### POST `/company-users/:id/regenerate-temp-password`
Regenerate and resend temp password.

**Auth:** Required · **Role:** `admin`

**Params:** `id` — company user ID
**Body:** None

---

### GET `/company-users`
List all company users (paginated).

**Auth:** Required

**Query:**
```
?page=1&limit=50&search=john
```

**Response:**
```json
{
  "users": [
    { "id": "...", "email": "...", "firstName": "...", "isActive": true, "role": { "id": "...", "name": "Staff" } }
  ],
  "meta": { "page": 1, "limit": 50, "total": 24 }
}
```

---

### GET `/company-users/:id`
Get a single company user with role and permissions.

**Auth:** Required

---

### PUT `/company-users/:id`
Update a company user.

**Auth:** Required · **Role:** `admin`

**Body:** (all optional)
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "roleId": "new_role_id",
  "isActive": false
}
```

---

### DELETE `/company-users/:id`
Soft-delete a company user.

**Auth:** Required · **Role:** `admin`
