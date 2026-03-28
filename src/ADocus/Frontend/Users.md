# Users — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (protected routes):** `Authorization: Bearer <access_token>`

---

## Auth Endpoints

### 1. Sign Up

```
POST /auth/signup
```

**Body:**
```json
{
  "email": "amit@gmail.com",
  "password": "secret123",
  "firstName": "Amit",
  "lastName": "Kapoor"
}
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Account created. Check your email for OTP." }
```

---

### 2. Verify Email (OTP)

```
POST /auth/verify-email
```

**Body:**
```json
{ "email": "amit@gmail.com", "otp": "123456" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Email verified successfully" }
```

---

### 3. Resend OTP

```
POST /auth/resend-otp
```

**Body:**
```json
{ "email": "amit@gmail.com" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "OTP resent successfully" }
```

---

### 4. Sign In

```
POST /auth/signin
```

**Body:**
```json
{ "email": "amit@gmail.com", "password": "secret123" }
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 2592000,
    "user": {
      "id": "user_id",
      "fullName": "Amit Kapoor",
      "email": "amit@gmail.com",
      "avatarUrl": null,
      "role": "user",
      "companyId": "company_id"
    }
  }
}
```

---

### 5. Google Sign In

```
POST /auth/google
```

**Body:**
```json
{ "idToken": "google_id_token_here" }
```

**Response:** Same as Sign In response above.

---

### 6. Forgot Password

```
POST /auth/forgot-password
```

**Body:**
```json
{ "email": "amit@gmail.com" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Reset link sent to your email" }
```

---

### 7. Reset Password

```
POST /auth/reset-password
```

**Body:**
```json
{ "token": "reset_token", "newPassword": "newSecret123" }
```

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Password reset successfully" }
```

---

### 8. Refresh Token

```
POST /auth/refresh-token
```

**Body:**
```json
{ "refresh_token": "eyJhbGci..." }
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 2592000
  }
}
```

---

### 9. Get My Profile

> Auth required.

```
GET /auth/me
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "user_id",
    "email": "amit@gmail.com",
    "fullName": "Amit Kapoor",
    "firstName": "Amit",
    "lastName": "Kapoor",
    "avatarUrl": null,
    "role": "user",
    "companyId": "company_id",
    "isEmailVerified": true,
    "createdAt": "2026-02-13T07:51:00.910Z"
  }
}
```

---

## User CRUD Endpoints

### 10. Create User

```
POST /users
```

**Body:**
```json
{
  "email": "user@example.com",
  "passwordHash": "hashed_value",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": null,
  "role": "user",
  "department": "Engineering",
  "status": "active"
}
```

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "User created successfully" }
```

---

### 11. List Users

```
POST /users/list
```

**Body** (all optional):
```json
{
  "page": 1,
  "limit": 25,
  "search": "amit"
}
```

> `search` matches against `firstName`, `lastName`, and `fullName` (case-insensitive).

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "user_id",
        "email": "amit@gmail.com",
        "fullName": "Amit Kapoor",
        "firstName": "Amit",
        "lastName": "Kapoor",
        "role": "user",
        "status": "active",
        "companyId": "company_id",
        "createdAt": "2026-02-13T07:51:00.910Z"
      }
    ],
    "meta": { "page": 1, "limit": 25, "totalRecords": 10 }
  }
}
```

---

### 12. Get Single User

```
GET /users/:id
```

**URL param:** `:id` — user ID

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "user_id",
    "email": "amit@gmail.com",
    "fullName": "Amit Kapoor",
    "firstName": "Amit",
    "lastName": "Kapoor",
    "role": "user",
    "status": "active",
    "companyId": "company_id",
    "isEmailVerified": true,
    "createdAt": "2026-02-13T07:51:00.910Z"
  }
}
```

---

### 13. Update User

```
PATCH /users/:id
```

**URL param:** `:id` — user ID

**Body** (all fields optional):
```json
{
  "firstName": "Amit",
  "lastName": "Kapoor",
  "avatarUrl": "https://...",
  "department": "Design",
  "status": "active"
}
```

> `fullName` is auto-regenerated when `firstName` or `lastName` changes.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "User updated successfully" }
```

---

### 14. Delete User

```
DELETE /users/:id
```

**URL param:** `:id` — user ID

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "User deleted successfully" }
```

---

## User Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Auto-generated ObjectId |
| `email` | String | Unique email |
| `fullName` | String | Auto-derived from firstName + lastName |
| `firstName` | String | First name |
| `lastName` | String? | Last name |
| `avatarUrl` | String? | Profile photo URL |
| `role` | String | Default `"user"` |
| `department` | String? | Department |
| `status` | String | Default `"active"` |
| `companyId` | String? | Linked company ID |
| `isEmailVerified` | Boolean | Email verification status |
| `createdAt` | DateTime | Record creation time |
| `updatedAt` | DateTime | Last update time |

---

## Notes for Frontend

- Store `access_token` in memory/secure storage — attach to every protected request as `Authorization: Bearer <token>`.
- Use `refresh_token` to get a new `access_token` when it expires.
- `companyId` in the token identifies which company the user belongs to — used for all company-scoped requests.
- `passwordHash` in Create User is for internal use — use the auth signup flow for normal registration.
