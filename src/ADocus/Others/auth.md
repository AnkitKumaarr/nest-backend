# Auth Module

**Base path:** `/auth`
**Auth required:** No (except `/auth/me`)

---

## Endpoints

### POST `/auth/signup`
Register a new user. Sends OTP to email.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "minLength8",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{ "message": "OTP sent to your email" }
```

---

### POST `/auth/verify-email`
Verify email with OTP. Returns tokens on success.

**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { "id": "...", "email": "...", "fullName": "..." }
}
```

---

### POST `/auth/signin`
Sign in with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 2592000,
  "user": { "id": "...", "fullName": "...", "email": "...", "role": "user", "orgId": "..." }
}
```

---

### POST `/auth/forgot-password`
Send a password reset link to email.

**Body:**
```json
{ "email": "user@example.com" }
```

---

### POST `/auth/reset-password`
Reset password using token from email.

**Body:**
```json
{
  "token": "tokenFromEmail",
  "newPassword": "newPass123"
}
```

---

### POST `/auth/resend-otp`
Resend verification OTP.

**Body:**
```json
{ "email": "user@example.com" }
```

---

### POST `/auth/google`
Sign in / sign up via Google.

**Body:**
```json
{ "idToken": "googleIdToken" }
```

---

### POST `/auth/refresh-token`
Refresh access token.

**Body:**
```json
{
  "refresh_token": "...",
  "current_access_token": "..."
}
```

---

### GET `/auth/me`
Get current user profile.

**Auth:** Required
**Body:** None
