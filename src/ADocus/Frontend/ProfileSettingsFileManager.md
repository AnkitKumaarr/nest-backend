# Profile · Settings · File Manager — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

All responses:
```json
{ "statusCode": 200, "success": true, "data": { ... } }
```

---

## Table of Contents

1. [Profile](#1-profile)
2. [Settings & Account](#2-settings--account)
3. [File Manager](#3-file-manager)

---

## 1. Profile

Base path: `/api/users`

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/users/profile | Fetch current user's profile |
| 2 | PATCH | /api/users/profile | Update profile details |
| 3 | PATCH | /api/users/social-links | Replace social links |
| 4 | POST | /api/users/avatar | Upload avatar image |
| 5 | DELETE | /api/users/account | Delete account permanently |

---

### 1.1 Get Profile

```
GET /api/users/profile
```

**Body:** none

**Response:**
```json
{
  "id": "680abc...",
  "name": "Jayvion Simon",
  "email": "jayvion@example.com",
  "location": "San Francisco, CA",
  "jobPost": "Senior Frontend Engineer",
  "studyAt": "Stanford University",
  "about": "Passionate about building clean and scalable UIs.",
  "avatarUrl": "http://localhost:4000/uploads/avatars/680abc.jpg",
  "socialLinks": [
    { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
    { "platform": "instagram", "url": "" },
    { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
    { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
  ]
}
```

> Call on page mount to pre-fill the Update Details and Social Links forms.

---

### 1.2 Update Profile Details

```
PATCH /api/users/profile
```

**Payload:** (all fields optional — send only changed ones)
```json
{
  "name":     "Jayvion Simon",
  "email":    "jayvion@example.com",
  "location": "San Francisco, CA",
  "jobPost":  "Senior Frontend Engineer",
  "studyAt":  "Stanford University",
  "about":    "Passionate about building clean and scalable UIs."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | no | Full display name |
| `email` | string | no | Must be a valid email |
| `location` | string | no | City / country free text |
| `jobPost` | string | no | Job title / position |
| `studyAt` | string | no | University or institution |
| `about` | string | no | Max 500 chars bio |

**Response:**
```json
{
  "id": "680abc...",
  "name": "Jayvion Simon",
  "email": "jayvion@example.com",
  "location": "San Francisco, CA",
  "jobPost": "Senior Frontend Engineer",
  "studyAt": "Stanford University",
  "about": "Passionate about building clean and scalable UIs.",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

---

### 1.3 Save Social Links

```
PATCH /api/users/social-links
```

Always send all 4 platforms. Use empty string `""` for no link.

**Payload:**
```json
{
  "socialLinks": [
    { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
    { "platform": "instagram", "url": "" },
    { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
    { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `socialLinks` | array | yes | Always send all 4 objects |
| `socialLinks[].platform` | string | yes | `facebook` \| `instagram` \| `linkedin` \| `twitter` |
| `socialLinks[].url` | string | yes | Full URL or empty string |

**Response:**
```json
{
  "socialLinks": [
    { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
    { "platform": "instagram", "url": "" },
    { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
    { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
  ],
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

---

### 1.4 Upload Avatar

```
POST /api/users/avatar
Content-Type: multipart/form-data
```

| Field | Type | Notes |
|-------|------|-------|
| `avatar` | File | JPEG / PNG / WebP — max 5 MB |

**Response:**
```json
{
  "avatarUrl": "http://localhost:4000/uploads/avatars/680abc.jpg"
}
```

```tsx
const handleAvatarUpload = async (file: File) => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch('/api/users/avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  return json.data.avatarUrl; // update avatar in local state
};
```

---

### 1.5 Delete Account

```
DELETE /api/users/account
```

Require the user to type `"DELETE"` before enabling the confirm button.

**Payload:**
```json
{ "confirmation": "DELETE" }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `confirmation` | string | yes | Must be exactly `"DELETE"` |

**Response:**
```json
{ "message": "Account deleted successfully" }
```

> On success: clear auth tokens → clear store → redirect to `/`.

---

## 2. Settings & Account

Base path: `/api/settings`

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/settings | Fetch all settings (pre-fill all tabs) |
| **Notifications** | | | |
| 2 | PATCH | /api/settings/notifications | Save notification preferences |
| **Security** | | | |
| 3 | PATCH | /api/settings/security/two-factor | Toggle 2FA on/off |
| 4 | GET | /api/settings/security/devices | List active sessions/devices |
| 5 | DELETE | /api/settings/security/devices | Revoke all other sessions |
| 6 | DELETE | /api/settings/security/devices/:id | Revoke one session |
| **Extensions** | | | |
| 7 | PATCH | /api/settings/extensions | Save extension preferences |
| **Danger Zone** | | | |
| 8 | POST | /api/settings/reset | Reset all settings to defaults |
| **Account — Status** | | | |
| 9 | PATCH | /api/settings/account/status | Toggle account active/inactive |
| **Account — Billing** | | | |
| 10 | GET | /api/settings/account/billing | Fetch billing info & current plan |
| 11 | PATCH | /api/settings/account/billing | Update billing details |
| 12 | PATCH | /api/settings/account/plan | Change / upgrade plan |
| 13 | DELETE | /api/settings/account/plan | Cancel current plan |
| 14 | GET | /api/settings/account/invoices | List invoices |
| 15 | GET | /api/settings/account/invoices/:id/download | Download invoice PDF |

---

### 2.1 Get All Settings

```
GET /api/settings
```

**Body:** none

**Response:**
```json
{
  "notifications": {
    "taskReminders":    true,
    "meetingReminders": true,
    "challengeUpdates": false,
    "systemUpdates":    true,
    "frequency":        "realtime"
  },
  "security": {
    "twoFactorEnabled": false
  },
  "extensions": {
    "floatingIcon":     true,
    "autoPinExtension": false,
    "iconPosition":     "bottomRight"
  },
  "account": {
    "isActive": true,
    "planId":   "starter",
    "billing": {
      "billingName":     "Jayvion Simon",
      "billingAddress":  "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
      "billingPhone":    "+1 202-555-0143",
      "paymentMethodId": "pm_visa_5678"
    }
  }
}
```

> If the user has no settings yet, the backend returns defaults automatically.

---

### 2.2 Save Notification Preferences

```
PATCH /api/settings/notifications
```

**Payload:**
```json
{
  "taskReminders":    true,
  "meetingReminders": true,
  "challengeUpdates": false,
  "systemUpdates":    true,
  "frequency":        "realtime"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `taskReminders` | boolean | yes | `true` / `false` |
| `meetingReminders` | boolean | yes | `true` / `false` |
| `challengeUpdates` | boolean | yes | `true` / `false` |
| `systemUpdates` | boolean | yes | `true` / `false` |
| `frequency` | string | yes | `"realtime"` \| `"daily"` \| `"weekly"` |

**Response:**
```json
{ "message": "Notification preferences saved" }
```

---

### 2.3 Toggle Two-Factor Authentication

```
PATCH /api/settings/security/two-factor
```

**Payload:**
```json
{ "enabled": true }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `enabled` | boolean | yes | `true` = enable, `false` = disable |

**Response:**
```json
{
  "twoFactorEnabled": true,
  "message": "Two-factor authentication enabled"
}
```

---

### 2.4 List Active Sessions / Devices

```
GET /api/settings/security/devices
```

**Body:** none

**Response:**
```json
[
  {
    "id":         "680sess1...",
    "name":       "Chrome on Windows",
    "type":       "Desktop",
    "location":   "San Francisco, CA",
    "lastActive": "2026-03-28T10:00:00.000Z",
    "isCurrent":  true
  },
  {
    "id":         "680sess2...",
    "name":       "Safari on iPhone",
    "type":       "Mobile",
    "location":   "New York, NY",
    "lastActive": "2026-03-27T18:30:00.000Z",
    "isCurrent":  false
  }
]
```

---

### 2.5 Revoke All Other Sessions

```
DELETE /api/settings/security/devices
```

**Body:** none

**Response:**
```json
{ "message": "3 other session(s) revoked" }
```

> Re-fetch the device list after success.

---

### 2.6 Revoke One Session

```
DELETE /api/settings/security/devices/:id
```

**URL param:** `:id` — device session ID

**Body:** none

**Response:**
```json
{ "message": "Session revoked" }
```

> Re-fetch the device list after success.

---

### 2.7 Save Extension Preferences

```
PATCH /api/settings/extensions
```

**Payload:**
```json
{
  "floatingIcon":     true,
  "autoPinExtension": false,
  "iconPosition":     "bottomRight"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `floatingIcon` | boolean | yes | Shows/hides the floating icon |
| `autoPinExtension` | boolean | yes | Auto-pin on browser startup |
| `iconPosition` | string | yes | `"bottomRight"` \| `"bottomLeft"` |

**Response:**
```json
{ "message": "Extension preferences saved" }
```

---

### 2.8 Reset All Settings to Defaults

```
POST /api/settings/reset
```

**Body:** none

**Response:**
```json
{ "message": "Settings reset to defaults" }
```

> After success, re-fetch `GET /api/settings` to reload all tabs.

---

### 2.9 Toggle Account Active Status

```
PATCH /api/settings/account/status
```

**Payload:**
```json
{ "isActive": false }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `isActive` | boolean | yes | `true` = active, `false` = deactivated |

**Response:**
```json
{
  "isActive": false,
  "message": "Account deactivated"
}
```

---

### 2.10 Get Billing Info & Current Plan

```
GET /api/settings/account/billing
```

**Body:** none

**Response:**
```json
{
  "currentPlan": {
    "id":        "starter",
    "name":      "Starter",
    "price":     4.99,
    "priceUnit": "month",
    "features":  ["200 meetings/month", "50 GB storage", "10 team members"]
  },
  "billingCycle":    "monthly",
  "nextPaymentDate": "2026-04-28",
  "billing": {
    "billingName":    "Jayvion Simon",
    "billingAddress": "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
    "billingPhone":   "+1 202-555-0143"
  },
  "paymentMethods": [
    { "id": "pm_visa_5678", "type": "Visa", "lastFour": "5678", "expiry": "12/25", "isDefault": true }
  ],
  "availablePlans": [
    { "id": "basic",   "name": "Basic",   "price": 0,    "priceUnit": "month", "features": ["100 tasks/month", "5 GB storage", "3 team members"],          "isCurrent": false },
    { "id": "starter", "name": "Starter", "price": 4.99, "priceUnit": "month", "features": ["200 meetings/month", "50 GB storage", "10 team members"],      "isCurrent": true  },
    { "id": "premium", "name": "Premium", "price": 9.99, "priceUnit": "month", "features": ["Unlimited tasks", "500 GB storage", "50 team members"],        "isCurrent": false }
  ]
}
```

---

### 2.11 Update Billing Details

```
PATCH /api/settings/account/billing
```

**Payload:**
```json
{
  "billingName":     "Jayvion Simon",
  "billingAddress":  "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
  "billingPhone":    "+1 202-555-0143",
  "paymentMethodId": "pm_visa_5678"
}
```

| Field | Type | Required |
|-------|------|----------|
| `billingName` | string | yes |
| `billingAddress` | string | yes |
| `billingPhone` | string | yes |
| `paymentMethodId` | string | yes |

**Response:**
```json
{ "message": "Billing details updated" }
```

---

### 2.12 Change / Upgrade Plan

```
PATCH /api/settings/account/plan
```

**Payload:**
```json
{ "planId": "premium" }
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `planId` | string | yes | `"basic"` \| `"starter"` \| `"premium"` |

**Response:**
```json
{ "planId": "premium", "message": "Plan upgraded to Premium" }
```

> Re-fetch `GET /api/settings/account/billing` after plan change to refresh the plan cards.

---

### 2.13 Cancel Current Plan

```
DELETE /api/settings/account/plan
```

**Body:** none

**Response:**
```json
{ "message": "Plan cancelled. Access continues until end of billing period." }
```

---

### 2.14 List Invoices

```
GET /api/settings/account/invoices
```

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |

**Response:**
```json
{
  "data": [
    { "id": "inv_001", "date": "2026-01-01", "amount": "$4.99", "status": "Paid" },
    { "id": "inv_002", "date": "2025-12-01", "amount": "$4.99", "status": "Paid" }
  ],
  "total": 3,
  "page":  1,
  "limit": 10
}
```

---

### 2.15 Download Invoice PDF

```
GET /api/settings/account/invoices/:id/download
```

**URL param:** `:id` — invoice ID

**Response:** `Content-Type: application/pdf` binary stream.

```tsx
const handleDownload = async (invoiceId: string) => {
  const res = await fetch(`/api/settings/account/invoices/${invoiceId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## 3. File Manager

Base path: `/api/file-manager`

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /api/file-manager | Upload a file |
| 2 | GET | /api/file-manager | List files (paginated) |
| 3 | GET | /api/file-manager/:id | Get one file |
| 4 | PATCH | /api/file-manager/:id | Update name / folder |
| 5 | DELETE | /api/file-manager/:id | Delete file |

---

### 3.1 Upload File

```
POST /api/file-manager
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | yes | Any file type — max 50 MB |
| `folder` | string | no | Folder / category (e.g. `"reports"`) |
| `name` | string | no | Custom display name (defaults to original filename) |

**Response:**
```json
{
  "id":        "680file...",
  "userId":    "680abc...",
  "url":       "http://localhost:4000/uploads/files/uuid-here.pdf",
  "name":      "Q1 Report.pdf",
  "size":      204800,
  "mimeType":  "application/pdf",
  "folder":    "reports",
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

```tsx
const handleUpload = async (file: File, folder?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (folder) form.append('folder', folder);
  // optional: form.append('name', 'Custom Name');

  const res = await fetch('/api/file-manager', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return res.json();
};
```

---

### 3.2 List Files

```
GET /api/file-manager
```

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `folder` | string | — | Filter by folder name |
| `search` | string | — | Search by file name |

**Example requests:**
```
GET /api/file-manager                          → all files, page 1
GET /api/file-manager?folder=reports           → files in "reports" folder
GET /api/file-manager?search=Q1&page=1        → name search
```

**Response:**
```json
{
  "data": [
    {
      "id":        "680file...",
      "userId":    "680abc...",
      "url":       "http://localhost:4000/uploads/files/uuid.pdf",
      "name":      "Q1 Report.pdf",
      "size":      204800,
      "mimeType":  "application/pdf",
      "folder":    "reports",
      "createdAt": "2026-03-28T10:00:00.000Z",
      "updatedAt": "2026-03-28T10:00:00.000Z"
    }
  ],
  "total": 15,
  "page":  1,
  "limit": 20
}
```

---

### 3.3 Get One File

```
GET /api/file-manager/:id
```

**Body:** none

**Response:** Single file object (same shape as list item).

---

### 3.4 Update File

```
PATCH /api/file-manager/:id
```

**Payload:** (both fields optional)
```json
{
  "name":   "Q1 Report Final.pdf",
  "folder": "archive"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | no | New display name |
| `folder` | string | no | Move to a different folder |

**Response:** Updated file object.

---

### 3.5 Delete File

```
DELETE /api/file-manager/:id
```

**Body:** none

**Response:**
```json
{ "message": "File deleted successfully" }
```

> Deletes both the database record and the physical file from disk. This action is irreversible — show a confirmation dialog before calling.

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error (wrong field type, missing required field, wrong confirmation text) |
| `401` | Missing or invalid Bearer token |
| `403` | Access denied (file belongs to another user) |
| `404` | Resource not found |
| `413` | File too large (avatar > 5 MB, file > 50 MB) |
