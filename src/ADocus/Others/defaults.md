# Default Seeded Data

This file documents all data **automatically inserted** when the system initialises.

- **Columns, Status, Priority** → Global (seeded once on first company creation — no `userId` / `companyId`)
- **Roles** → Per-company (seeded for every new company with company-specific permissions)

---

## Field Rules for Column / Status / Priority

| Field | Description | Modifiable? |
|---|---|---|
| `id` | Auto-generated MongoDB ObjectId | No |
| `name` | Immutable key set at creation time | **Never** |
| `label` | Display name shown in UI | **Yes** (PUT endpoint) |
| `value` | Lowercase of `label`, auto-derived on create/update | Auto |
| `isDefault` | `true` for seeded defaults, `false` for user-created | No |
| `createdAt` | Timestamp | No |
| `updatedAt` | Auto-updated on any change | Auto |

---

## Columns (`Column` collection)

> Seeded **once globally**. Used as Kanban board lanes.

| # | name | label | value | isDefault |
|---|---|---|---|---|
| 1 | TODO | TODO | todo | true |
| 2 | INPROGRESS | INPROGRESS | inprogress | true |
| 3 | SELF TESTING | SELF TESTING | self testing | true |
| 4 | BLOCKER | BLOCKER | blocker | true |
| 5 | QA READY | QA READY | qa ready | true |
| 6 | DONE | DONE | done | true |

---

## Status (`Status` collection)

> Seeded **once globally**. Used as status labels on tasks.

| # | name | label | value | isDefault |
|---|---|---|---|---|
| 1 | Todo | Todo | todo | true |
| 2 | In Progress | In Progress | in progress | true |
| 3 | Completed | Completed | completed | true |
| 4 | Unassigned | Unassigned | unassigned | true |

---

## Priority (`Priority` collection)

> Seeded **once globally**. Used as priority labels on tasks.

| # | name | label | value | isDefault |
|---|---|---|---|---|
| 1 | Urgent | Urgent | urgent | true |
| 2 | High | High | high | true |
| 3 | Medium | Medium | medium | true |
| 4 | Low | Low | low | true |
| 5 | Unassigned | Unassigned | unassigned | true |

---

## Roles (`Role` collection)

> Seeded **per company** on company creation. Each company gets its own copy.

| # | name | Permissions |
|---|---|---|
| 1 | Admin | `*` (all permissions) |
| 2 | Manager | `task:create` · `task:edit` · `task:delete` · `task:view` · `team:manage-members` · `team:view` · `project:create` · `project:edit` · `project:view` · `user:view` · `user:create` · `user:edit` · `role:view` · `column:create` · `column:delete` |
| 3 | Team Lead | `task:create` · `task:edit` · `task:delete` · `task:view` · `team:manage-members` · `team:view` · `project:view` · `user:view` · `column:create` · `column:delete` |
| 4 | Business Analyst | `task:create` · `task:edit` · `task:view` · `team:view` · `project:view` · `user:view` |
| 5 | Developer | `task:create` · `task:edit` · `task:view` · `team:view` · `project:view` |
| 6 | QA Engineer | `task:create` · `task:edit` · `task:view` · `team:view` · `project:view` |
| 7 | Sales Lead | `task:create` · `task:edit` · `task:view` · `team:view` · `project:view` · `user:view` |
| 8 | HR | `user:view` · `user:create` · `user:edit` · `team:view` · `role:view` |
| 9 | Employee | `task:create` · `task:edit` · `task:view` · `team:view` |
| 10 | User | `task:view` · `team:view` |

**Fields:** `id`, `name`, `permissions` (string[]), `companyId`, `createdAt`, `updatedAt`

---

## Seeding Behaviour

| Collection | Scope | When | Guard |
|---|---|---|---|
| `Column` | Global | First company creation | Skipped if `count > 0` |
| `Status` | Global | First company creation | Skipped if `count > 0` |
| `Priority` | Global | First company creation | Skipped if `count > 0` |
| `Role` | Per-company | Every company creation | New set per `companyId` |

---

## Permission Reference

| Permission | Description |
|---|---|
| `*` | Full access — all operations |
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
