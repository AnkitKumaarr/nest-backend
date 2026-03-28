# Profile — Frontend API Guide

**Collection:** `users` existing
**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

Only **Update Details** and **Social Links** tabs need API integration.
The **Sketch** tab is read-only (displays already-fetched user data).

---

## API Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | /api/users/profile | Fetch current user profile |
| 2 | PATCH | /api/users/profile | Update profile details |
| 3 | PATCH | /api/users/social-links | Save all social links |
| 4 | POST | /api/users/avatar | Upload profile avatar |

---

## 1. Get Current User Profile

Fetch the logged-in user's full profile (used to pre-fill the Update Details form on mount).

```
GET /api/users/profile
```

**Body:** none

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "680abc...",
    "name": "Jayvion Simon",
    "email": "jayvion@example.com",
    "location": "San Francisco, CA",
    "jobPost": "Senior Frontend Engineer",
    "studyAt": "Stanford University",
    "about": "Passionate about building clean and scalable UIs.",
    "avatarUrl": "https://cdn.example.com/avatars/680abc.jpg",
    "socialLinks": [
      { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
      { "platform": "instagram", "url": "https://instagram.com/jayvion" },
      { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
      { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
    ]
  }
}
```

---

## 2. Update Profile Details

Updates core profile fields. Only send fields the user changed.

```
PATCH /api/users/profile
```

### Payload

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

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Full display name |
| `email` | string | yes | Must be a valid email |
| `location` | string | no | City / country free text |
| `jobPost` | string | no | Job title / position |
| `studyAt` | string | no | University or institution |
| `about` | string | no | Max ~500 chars bio |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "680abc...",
    "name": "Jayvion Simon",
    "email": "jayvion@example.com",
    "location": "San Francisco, CA",
    "jobPost": "Senior Frontend Engineer",
    "studyAt": "Stanford University",
    "about": "Passionate about building clean and scalable UIs.",
    "updatedAt": "2026-03-28T10:00:00.000Z"
  }
}
```

> On success, re-populate the form with the returned data so the user sees the persisted values.

---

## 3. Save Social Links

Replaces the user's entire social links array in the DB. Send all 4 platforms every time (empty string = no link for that platform).

```
PATCH /api/users/social-links
```

### Payload

Social links are stored as an **array of objects** in the `users` collection.

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

### Supported Platforms

| `platform` value | Label | Color |
|-----------------|-------|-------|
| `facebook` | Facebook | #1877f2 |
| `instagram` | Instagram | #e4405f |
| `linkedin` | LinkedIn | #0077b5 |
| `twitter` | Twitter / X | #1da1f2 |

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `socialLinks` | array | yes | Always send all 4 objects |
| `socialLinks[].platform` | string | yes | One of the 4 values above |
| `socialLinks[].url` | string | yes | Full URL or empty string |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "socialLinks": [
      { "platform": "facebook",  "url": "https://facebook.com/jayvion" },
      { "platform": "instagram", "url": "" },
      { "platform": "linkedin",  "url": "https://linkedin.com/in/jayvion" },
      { "platform": "twitter",   "url": "https://twitter.com/jayvion" }
    ],
    "updatedAt": "2026-03-28T10:00:00.000Z"
  }
}
```

> On success, update local state with the returned `socialLinks` array so the Sketch tab reflects the new links immediately.

---

## 4. Upload Avatar

Multipart upload. Returns a CDN URL to store in the user's profile.

```
POST /api/users/avatar
Content-Type: multipart/form-data
```

### Payload

| Field | Type | Notes |
|-------|------|-------|
| `avatar` | File | JPEG / PNG / WebP, max 5 MB |

### Response

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/680abc.jpg"
  }
}
```

---

## Frontend Integration Pattern

```tsx
// Pre-fill form on mount
const { data } = useGetUserProfileQuery();
const profileData = data?.data;

// Map socialLinks array → object for form inputs
const socialObj = Object.fromEntries(
  (profileData?.socialLinks ?? []).map(({ platform, url }) => [platform, url])
);
// { facebook: '...', instagram: '', linkedin: '...', twitter: '...' }

// Save social links — convert form object back to array
const handleSocialLinksSave = async (formValues: SocialLinksForm) => {
  const payload = {
    socialLinks: ['facebook', 'instagram', 'linkedin', 'twitter'].map((platform) => ({
      platform,
      url: formValues[platform] ?? '',
    })),
  };
  await updateSocialLinks(payload);
};
```

---

## DB Shape (users collection)

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "location": "string",
  "jobPost": "string",
  "studyAt": "string",
  "about": "string",
  "avatarUrl": "string",
  "socialLinks": [
    { "platform": "facebook",  "url": "string" },
    { "platform": "instagram", "url": "string" },
    { "platform": "linkedin",  "url": "string" },
    { "platform": "twitter",   "url": "string" }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error (invalid email, missing required field) |
| `401` | Missing or invalid Bearer token |
| `413` | Avatar file too large |
