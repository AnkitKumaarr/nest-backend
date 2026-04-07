# Comments — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> `commentBy` and `replyBy` are **set automatically by the backend** from the logged-in user's token. Do not send them in any payload.
> `renderedHtml` must be **converted by the frontend** and sent in every add/update payload — the backend does not convert it.

---

## How Replies Are Stored in the DB

Replies are **embedded objects** inside the Comment document. There are no separate reply documents.

**Comment document shape in MongoDB:**
```json
{
  "_id": "68a1b2c3d4e5f6a7b8c9d0e1",
  "taskId": "...",
  "commentBy": { "userId": "...", "name": "Amit Shah" },
  "comment": { "type": "doc", "content": [...] },
  "renderedHtml": "<p>This looks good!</p>",
  "contentPreview": "This looks good!",
  "replies": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "replyBy": { "userId": "...", "name": "Rahul Verma" },
      "comment": { "type": "doc", "content": [...] },
      "renderedHtml": "<p>Agreed!</p>",
      "contentPreview": "Agreed!",
      "createdAt": "2026-03-22T00:05:00.000Z",
      "updatedAt": "2026-03-22T00:05:00.000Z"
    }
  ],
  "createdAt": "2026-03-22T00:00:00.000Z",
  "updatedAt": "2026-03-22T00:00:00.000Z"
}
```

- Every new comment has `replies: []` by default.
- `replyBy` exists only inside reply objects — never at comment root level.
- Deleting a comment removes all its replies automatically (embedded).
- Each reply has a UUID `id` (generated server-side).

---

## 1. Add Comment

```
POST /comments
```

**Body:**
```json
{
  "taskId": "68a1b2c3d4e5f6a7b8c9d0e1",
  "comment": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "This looks good!" }] }
    ]
  },
  "renderedHtml": "<p>This looks good!</p>"
}
```

| Field          | Type   | Required | Description                       |
|----------------|--------|----------|-----------------------------------|
| `taskId`       | string | Yes      | ID of the task                    |
| `comment`      | object | Yes      | ProseMirror/TipTap JSON doc       |
| `renderedHtml` | string | Yes      | HTML string converted by frontend |

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Comment added successfully" }
```

---

## 2. List Comments

```
POST /comments/list
```

**Body:**
```json
{
  "taskId": "68a1b2c3d4e5f6a7b8c9d0e1",
  "page": 1,
  "limit": 20
}
```

| Field    | Type   | Required | Default | Description      |
|----------|--------|----------|---------|------------------|
| `taskId` | string | Yes      | —       | ID of the task   |
| `page`   | number | No       | 1       | Page number      |
| `limit`  | number | No       | 20      | Records per page |

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "data": [
      {
        "id": "68a1b2c3d4e5f6a7b8c9d0e1",
        "taskId": "68a1b2c3d4e5f6a7b8c9d0e1",
        "commentBy": { "userId": "68a1b2c3d4e5f6a7b8c9d0e1", "name": "Amit Shah" },
        "comment": { "type": "doc", "content": ["..."] },
        "renderedHtml": "<p>This looks good!</p>",
        "contentPreview": "This looks good!",
        "replies": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "replyBy": { "userId": "68a1b2c3d4e5f6a7b8c9d0e2", "name": "Rahul Verma" },
            "comment": { "type": "doc", "content": ["..."] },
            "renderedHtml": "<p>Agreed!</p>",
            "contentPreview": "Agreed!",
            "createdAt": "2026-03-22T00:05:00.000Z",
            "updatedAt": "2026-03-22T00:05:00.000Z"
          }
        ],
        "createdAt": "2026-03-22T00:00:00.000Z",
        "updatedAt": "2026-03-22T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 5 }
  }
}
```

---

## 3. Update Comment

```
PUT /comments
```

**Body:**
```json
{
  "commentId": "68a1b2c3d4e5f6a7b8c9d0e1",
  "comment": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Updated comment text" }] }
    ]
  },
  "renderedHtml": "<p>Updated comment text</p>"
}
```

| Field          | Type   | Required | Description                       |
|----------------|--------|----------|-----------------------------------|
| `commentId`    | string | Yes      | ID of the comment to update       |
| `comment`      | object | Yes      | Updated ProseMirror/TipTap JSON   |
| `renderedHtml` | string | Yes      | HTML string converted by frontend |

> Returns `403 Forbidden` if the logged-in user is not the comment author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Comment updated successfully" }
```

---

## 4. Delete Comment

> Also removes all embedded replies.

```
DELETE /comments/:id
```

**URL param:** `:id` — comment ID

> Returns `403 Forbidden` if the logged-in user is not the comment author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Comment deleted successfully" }
```

---

## 5. Add Reply

```
POST /comments/reply
```

**Body:**
```json
{
  "commentId": "68a1b2c3d4e5f6a7b8c9d0e1",
  "reply": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Agreed!" }] }
    ]
  },
  "renderedHtml": "<p>Agreed!</p>"
}
```

| Field          | Type   | Required | Description                       |
|----------------|--------|----------|-----------------------------------|
| `commentId`    | string | Yes      | ID of the parent comment          |
| `reply`        | object | Yes      | ProseMirror/TipTap JSON doc       |
| `renderedHtml` | string | Yes      | HTML string converted by frontend |

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Reply added successfully" }
```

---

## 6. Update Reply

```
PUT /comments/reply
```

**Body:**
```json
{
  "commentId": "68a1b2c3d4e5f6a7b8c9d0e1",
  "replyId": "550e8400-e29b-41d4-a716-446655440000",
  "reply": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Updated reply text" }] }
    ]
  },
  "renderedHtml": "<p>Updated reply text</p>"
}
```

| Field          | Type   | Required | Description                       |
|----------------|--------|----------|-----------------------------------|
| `commentId`    | string | Yes      | ID of the parent comment          |
| `replyId`      | string | Yes      | `_id` of the reply to update      |
| `reply`        | object | Yes      | Updated ProseMirror/TipTap JSON   |
| `renderedHtml` | string | Yes      | HTML string converted by frontend |

> Returns `403 Forbidden` if the logged-in user is not the reply author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Reply updated successfully" }
```

---

## 7. Delete Reply

```
DELETE /comments/reply/:commentId/:replyId
```

**URL params:**
- `:commentId` — ID of the parent comment
- `:replyId` — UUID of the reply to delete

> Returns `403 Forbidden` if the logged-in user is not the reply author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Reply deleted successfully" }
```

---

## Notes for Frontend

- `replies: []` is always present on every comment (empty by default on new comments).
- `commentBy` is on the comment root; `replyBy` is inside each reply object.
- `renderedHtml` must be converted by the frontend before sending (do not rely on backend conversion).
- `contentPreview` (plain text, max 200 chars) is still extracted server-side — do not send it.
- Only the comment/reply author can edit or delete their own entry.
- The reply `_id` is a MongoDB ObjectId hex string (24 chars), generated server-side.
