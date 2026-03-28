# Settings & Account — Frontend API Guide

**Collection:** `settings` => new
**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

Both the **Settings** page (Notifications, Security, Extensions, Danger Zone)
and the **Account** page (Status, Billing) read from and write to the `settings` collection,
scoped to the logged-in user.

---

## API Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/settings | Fetch all settings for current user |
| **Notification Settings** | | | |
| 2 | PATCH | /api/settings/notifications | Save notification preferences |
| **Security Settings** | | | |
| 3 | PATCH | /api/settings/security/two-factor | Toggle 2FA on/off |
| 4 | GET | /api/settings/security/devices | List active sessions/devices |
| 5 | DELETE | /api/settings/security/devices/:id | Revoke one device session |
| 6 | DELETE | /api/settings/security/devices | Revoke all other sessions |
| **Extension Settings** | | | |
| 7 | PATCH | /api/settings/extensions | Save extension preferences |
| **Danger Zone** | | | |
| 8 | POST | /api/settings/reset | Reset all settings to defaults |
| 9 | DELETE | /api/users/account | Permanently delete account |
| **Account — Status** | | | |
| 10 | PATCH | /api/settings/account/status | Toggle account active/inactive |
| **Account — Billing** | | | |
| 11 | GET | /api/settings/account/billing | Fetch billing info & current plan |
| 12 | PATCH | /api/settings/account/billing | Update billing details |
| 13 | PATCH | /api/settings/account/plan | Change/upgrade subscription plan |
| 14 | DELETE | /api/settings/account/plan | Cancel current plan |
| 15 | GET | /api/settings/account/invoices | List invoices |
| 16 | GET | /api/settings/account/invoices/:id/download | Download invoice PDF |

---

## 1. Get All Settings

Fetch the full settings document for the logged-in user on page load.
Used to pre-fill all tabs (Notifications, Security, Extensions, Account Status, Billing).

```
GET /api/settings
```

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "notifications": {
      "taskReminders": true,
      "meetingReminders": true,
      "challengeUpdates": false,
      "systemUpdates": true,
      "frequency": "realtime"
    },
    "security": {
      "twoFactorEnabled": false
    },
    "extensions": {
      "floatingIcon": true,
      "autoPinExtension": false,
      "iconPosition": "bottomRight"
    },
    "account": {
      "isActive": true,
      "planId": "starter",
      "billing": {
        "billingName": "Jayvion Simon",
        "billingAddress": "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
        "billingPhone": "+1 202-555-0143",
        "paymentMethodId": "pm_visa_5678"
      }
    }
  }
}
```

> If the user has no settings document yet (first login), the backend should return these defaults.

---

## SETTINGS PAGE

---

## 2. Save Notification Preferences

```
PATCH /api/settings/notifications
```

### Payload

```json
{
  "taskReminders":    true,
  "meetingReminders": true,
  "challengeUpdates": false,
  "systemUpdates":    true,
  "frequency":        "realtime"
}
```

### Field Rules

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `taskReminders` | boolean | yes | `true` / `false` |
| `meetingReminders` | boolean | yes | `true` / `false` |
| `challengeUpdates` | boolean | yes | `true` / `false` |
| `systemUpdates` | boolean | yes | `true` / `false` |
| `frequency` | string | yes | `"realtime"` \| `"daily"` \| `"weekly"` |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Notification preferences saved" }
}
```

> Call on every toggle/dropdown change (debounce 500 ms) or on an explicit Save button.

---

## 3. Toggle Two-Factor Authentication

```
PATCH /api/settings/security/two-factor
```

### Payload

```json
{
  "enabled": true
}
```

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `enabled` | boolean | yes | `true` = enable 2FA, `false` = disable |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "twoFactorEnabled": true,
    "message": "Two-factor authentication enabled"
  }
}
```

> If enabling 2FA, the backend may return a QR code URI for authenticator app setup. Handle that flow separately if needed.

---

## 4. List Active Sessions / Devices

Returns all devices with active sessions for the current user.

```
GET /api/settings/security/devices
```

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "dev_001",
      "name": "Chrome on Windows",
      "type": "Desktop",
      "location": "San Francisco, CA",
      "lastActive": "2026-03-28T10:00:00.000Z",
      "isCurrent": true
    },
    {
      "id": "dev_002",
      "name": "Safari on iPhone",
      "type": "Mobile",
      "location": "New York, NY",
      "lastActive": "2026-03-27T18:30:00.000Z",
      "isCurrent": false
    }
  ]
}
```

---

## 5. Revoke One Device Session

```
DELETE /api/settings/security/devices/:id
```

**URL param:** `:id` — device session ID

**Body:** none

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Session revoked" }
}
```

> Re-fetch the device list after a successful revoke.

---

## 6. Revoke All Other Sessions

Revokes all sessions except the current one.

```
DELETE /api/settings/security/devices
```

**Body:** none

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "3 other session(s) revoked" }
}
```

---

## 7. Save Extension Preferences

```
PATCH /api/settings/extensions
```

### Payload

```json
{
  "floatingIcon":    true,
  "autoPinExtension": false,
  "iconPosition":    "bottomRight"
}
```

### Field Rules

| Field | Type | Required | Values / Notes |
|-------|------|----------|----------------|
| `floatingIcon` | boolean | yes | Shows/hides the floating extension icon |
| `autoPinExtension` | boolean | yes | Auto-pin on browser startup |
| `iconPosition` | string | yes | `"bottomRight"` \| `"bottomLeft"` — ignored when `floatingIcon` is `false` |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Extension preferences saved" }
}
```

---

## 8. Reset All Settings to Defaults

Resets the entire settings document to factory defaults. Show a confirmation dialog before calling.

```
POST /api/settings/reset
```

**Body:** none

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Settings reset to defaults" }
}
```

> After success, re-fetch `GET /api/settings` to reload all tabs with default values.

---

## 9. Delete Account (Danger Zone)

Permanently deletes the user's account and all associated data.
Frontend must require the user to type `"DELETE"` before enabling the confirm button.

```
DELETE /api/users/account
```

### Payload

```json
{
  "confirmation": "DELETE"
}
```

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `confirmation` | string | yes | Must be exactly `"DELETE"` (backend validates) |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Account deleted successfully" }
}
```

> On success: clear auth tokens, clear Redux store, redirect to `/` (home/login).

---

## ACCOUNT PAGE

---

## 10. Toggle Account Active Status

Activates or deactivates the account (soft disable — does not delete).

```
PATCH /api/settings/account/status
```

### Payload

```json
{
  "isActive": false
}
```

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `isActive` | boolean | yes | `true` = active, `false` = deactivated |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "isActive": false,
    "message": "Account deactivated"
  }
}
```

---

## 11. Get Billing Info & Current Plan

```
GET /api/settings/account/billing
```

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "currentPlan": {
      "id": "starter",
      "name": "Starter",
      "price": 4.99,
      "priceUnit": "month",
      "features": ["200 meetings/month", "50 GB storage", "10 team members"]
    },
    "billingCycle": "monthly",
    "nextPaymentDate": "2026-04-28",
    "billing": {
      "billingName": "Jayvion Simon",
      "billingAddress": "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
      "billingPhone": "+1 202-555-0143"
    },
    "paymentMethods": [
      { "id": "pm_visa_5678",   "type": "Visa",       "lastFour": "5678", "expiry": "12/25", "isDefault": true  },
      { "id": "pm_visa_1234",   "type": "Visa",       "lastFour": "1234", "expiry": "06/26", "isDefault": false }
    ],
    "availablePlans": [
      {
        "id": "basic",
        "name": "Basic",
        "price": 0,
        "priceUnit": "month",
        "features": ["100 tasks/month", "5 GB storage", "3 team members"],
        "isCurrent": false
      },
      {
        "id": "starter",
        "name": "Starter",
        "price": 4.99,
        "priceUnit": "month",
        "features": ["200 meetings/month", "50 GB storage", "10 team members"],
        "isCurrent": true
      },
      {
        "id": "premium",
        "name": "Premium",
        "price": 9.99,
        "priceUnit": "month",
        "features": ["Unlimited tasks", "500 GB storage", "50 team members"],
        "isCurrent": false
      }
    ]
  }
}
```

---

## 12. Update Billing Details

```
PATCH /api/settings/account/billing
```

### Payload

```json
{
  "billingName":    "Jayvion Simon",
  "billingAddress": "19034 Verna Unions Apt. 164 - Honolulu, RI / 87535",
  "billingPhone":   "+1 202-555-0143",
  "paymentMethodId": "pm_visa_5678"
}
```

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `billingName` | string | yes | Name on the billing account |
| `billingAddress` | string | yes | Full billing address |
| `billingPhone` | string | yes | Contact phone number |
| `paymentMethodId` | string | yes | ID of the selected payment method |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Billing details updated" }
}
```

---

## 13. Change / Upgrade Plan

```
PATCH /api/settings/account/plan
```

### Payload

```json
{
  "planId": "premium"
}
```

### Field Rules

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `planId` | string | yes | `"basic"` \| `"starter"` \| `"premium"` |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "planId": "premium",
    "message": "Plan upgraded to Premium"
  }
}
```

> Re-fetch `GET /api/settings/account/billing` after plan change to refresh plan cards and billing info.

---

## 14. Cancel Current Plan

```
DELETE /api/settings/account/plan
```

**Body:** none

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": { "message": "Plan cancelled. Access continues until end of billing period." }
}
```

---

## 15. List Invoices

```
GET /api/settings/account/invoices
```

### Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      { "id": "inv_001", "date": "2026-01-01", "amount": "$4.99", "status": "Paid" },
      { "id": "inv_002", "date": "2025-12-01", "amount": "$4.99", "status": "Paid" },
      { "id": "inv_003", "date": "2025-11-01", "amount": "$4.99", "status": "Paid" }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

---

## 16. Download Invoice PDF

Returns the PDF file directly (binary stream). The frontend should trigger a browser download.

```
GET /api/settings/account/invoices/:id/download
```

**URL param:** `:id` — invoice ID

**Response:** `Content-Type: application/pdf` binary stream

```tsx
// Download pattern
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

## DB Shape (settings collection)

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",

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
      "billingName":     "string",
      "billingAddress":  "string",
      "billingPhone":    "string",
      "paymentMethodId": "string"
    }
  },

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

> Invoices and payment method details are typically managed by a payment provider (e.g. Stripe).
> The `paymentMethodId` stored here is a reference to the provider's payment method ID.

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error (invalid field, wrong confirmation text, unknown planId) |
| `401` | Missing or invalid Bearer token |
| `403` | Action not allowed (e.g. revoking current session, deleting without confirmation) |
| `404` | Device / invoice not found |
