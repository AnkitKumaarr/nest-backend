# Permissions — Frontend Reference

> Permissions are **strings stored on each Role**. They are returned inside the JWT token and in the user object after sign-in. The frontend uses them to show/hide UI elements.

---

## How Permissions Work

1. User signs in → receives `access_token`
2. JWT payload includes `permissions: string[]`
3. Frontend reads permissions and guards routes / buttons accordingly

**Sign-in response payload (relevant fields):**
```json
{
  "user": {
    "id": "...",
    "role": "Manager",
    "permissions": ["task:create", "task:edit", "task:view", "team:view"]
  }
}
```

---

## Full Permission Reference

| Permission | What it allows |
|---|---|
| `*` | Everything (Admin only) |
| `task:create` | Create project tasks |
| `task:edit` | Edit any task |
| `task:delete` | Delete any task |
| `task:view` | View tasks |
| `team:view` | View teams and members |
| `team:manage-members` | Add / remove team members |
| `project:create` | Create projects |
| `project:edit` | Edit projects |
| `project:view` | View projects |
| `user:view` | View company users |
| `user:create` | Invite / create users |
| `user:edit` | Update user details |
| `role:view` | View roles list |
| `column:create` | Create board columns |
| `column:delete` | Delete board columns |

---

## Default Permissions Per Role

| Role | Permissions |
|---|---|
| **Admin** | `*` (all) |
| **Manager** | task CRUD · team manage · project CRUD · user create/edit/view · role view · column manage |
| **Team Lead** | task CRUD · team manage · project view · user view · column manage |
| **Business Analyst** | task create/edit/view · team view · project view · user view |
| **Developer** | task create/edit/view · team view · project view |
| **QA Engineer** | task create/edit/view · team view · project view |
| **Sales Lead** | task create/edit/view · team view · project view · user view |
| **HR** | user create/edit/view · team view · role view |
| **Employee** | task create/edit/view · team view |
| **User** | task view · team view |

---

## Frontend Usage Example

```ts
// Store permissions after login
const permissions: string[] = user.permissions;

const can = (permission: string) =>
  permissions.includes('*') || permissions.includes(permission);

// Guard a button
can('task:create')   // true → show "Create Task" button
can('user:create')   // false → hide "Invite User" button
```
