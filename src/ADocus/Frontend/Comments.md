# Comments — Frontend API Guide

**Base URL:** `http://localhost:4000`
**Auth header (all requests):** `Authorization: Bearer <access_token>`

> `commentBy` and `replyBy` are **set automatically by the backend** from the logged-in user's token. Do not send them in any payload.

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
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "This looks good!" }]
      }
    ]
  }
}
```

| Field     | Type   | Required | Description                  |
|-----------|--------|----------|------------------------------|
| `taskId`  | string | Yes      | ID of the task               |
| `comment` | object | Yes      | ProseMirror/TipTap JSON doc  |

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
        "commentBy": {
          "userId": "68a1b2c3d4e5f6a7b8c9d0e1",
          "name": "Amit Shah"
        },
        "comment": { "type": "doc", "content": [...] },
        "renderedHtml": "<p>This looks good!</p>",
        "contentPreview": "This looks good!",
        "parentId": null,
        "createdAt": "2026-03-22T00:00:00.000Z",
        "updatedAt": "2026-03-22T00:00:00.000Z",
        "replies": [
          {
            "id": "68a1b2c3d4e5f6a7b8c9d0e2",
            "commentBy": {
              "userId": "68a1b2c3d4e5f6a7b8c9d0e2",
              "name": "Rahul Verma"
            },
            "comment": { "type": "doc", "content": [...] },
            "renderedHtml": "<p>Agreed!</p>",
            "contentPreview": "Agreed!",
            "parentId": "68a1b2c3d4e5f6a7b8c9d0e1",
            "createdAt": "2026-03-22T00:05:00.000Z",
            "updatedAt": "2026-03-22T00:05:00.000Z"
          }
        ]
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
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Updated comment text" }]
      }
    ]
  }
}
```

| Field       | Type   | Required | Description                     |
|-------------|--------|----------|---------------------------------|
| `commentId` | string | Yes      | ID of the comment to update     |
| `comment`   | object | Yes      | Updated ProseMirror/TipTap JSON |

> Returns `403 Forbidden` if the logged-in user is not the comment author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Comment updated successfully" }
```

---

## 4. Delete Comment

> Also deletes all replies under this comment.

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
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Agreed!" }]
      }
    ]
  }
}
```

| Field       | Type   | Required | Description                  |
|-------------|--------|----------|------------------------------|
| `commentId` | string | Yes      | ID of the parent comment     |
| `reply`     | object | Yes      | ProseMirror/TipTap JSON doc  |

**Response:**
```json
{ "statusCode": 201, "success": true, "message": "Reply added successfully" }
```

---

## 6. Delete Reply

```
DELETE /comments/reply/:id
```

**URL param:** `:id` — reply ID

> Returns `403 Forbidden` if the logged-in user is not the reply author.

**Response:**
```json
{ "statusCode": 200, "success": true, "message": "Reply deleted successfully" }
```

---

## Comment Content Format

The `comment` / `reply` field uses the **ProseMirror/TipTap JSON doc** format. The backend stores content in three fields automatically:

| Stored Field     | Description                                              |
|------------------|----------------------------------------------------------|
| `comment`        | Raw JSON doc — use this to re-hydrate the editor         |
| `renderedHtml`   | HTML string — use this to display without an editor      |
| `contentPreview` | Plain text, max 200 chars — use this for notifications   |

**Supported inline marks:**
`bold` · `italic` · `underline` · `strike` · `code` · `link`

**Supported block nodes:**
`paragraph` · `heading` · `bulletList` · `orderedList` · `listItem` · `blockquote` · `codeBlock` · `horizontalRule` · `hardBreak`

---

## Notes for Frontend

- Top-level comments have `parentId: null`; replies have `parentId` set to the parent comment's `id`.
- List returns top-level comments only, with `replies[]` nested inside each.
- `commentBy.name` and `commentBy.userId` are auto-populated from the auth token — never send these from the frontend.
- Only the comment/reply author can edit or delete their own entry.
