# Roles API Documentation

## Authentication
All endpoints require authentication with a valid JWT token. The user must have the `admin` role to access these endpoints.

---

## Create Role

Create a new role for the company.

### Endpoint
`POST /roles`

### Authentication
- Required: Yes
- Role: `admin`

### Request Body
```json
{
  "name": "string",
  "permissions": ["string"]
}
```

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the role (e.g., "Project Manager", "Developer") |
| permissions | string[] | Yes | Array of permission strings (e.g., ["project:create", "task:manage"]) |

### Example Request
```json
{
  "name": "Project Manager",
  "permissions": ["project:create", "project:update", "project:delete", "task:manage"]
}
```

### Example Response
```json
{
  "id": "role_id",
  "name": "Project Manager",
  "permissions": ["project:create", "project:update", "project:delete", "task:manage"],
  "companyId": "company_id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Get Roles

Retrieve all roles for the company, including default roles.

### Endpoint
`GET /roles`

### Authentication
- Required: Yes
- Role: `admin`

### Request Body
None (companyId is extracted from JWT token)

### Query Parameters
None

### Example Response
```json
{
  "data": [
    {
      "id": "role_id_1",
      "name": "Project Manager",
      "permissions": ["project:create", "project:update", "project:delete", "task:manage"],
      "companyId": "company_id",
      "isDefault": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "role_id_2",
      "name": "Developer",
      "permissions": ["task:create", "task:update"],
      "companyId": null,
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Notes
- Returns both company-specific roles (where companyId matches the user's company)
- Also returns default roles (where companyId is null/isDefault is true)
- Default roles can be used across all companies

---

## Update Role

Update an existing role.

### Endpoint
`PUT /roles/:id`

### Authentication
- Required: Yes
- Role: `admin`

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the role to update |

### Request Body
```json
{
  "name": "string",
  "permissions": ["string"]
}
```

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Updated name of the role |
| permissions | string[] | Yes | Updated array of permission strings |

### Example Request
```json
{
  "name": "Senior Project Manager",
  "permissions": ["project:create", "project:update", "project:delete", "task:manage", "team:manage"]
}
```

### Example Response
```json
{
  "id": "role_id",
  "name": "Senior Project Manager",
  "permissions": ["project:create", "project:update", "project:delete", "task:manage", "team:manage"],
  "companyId": "company_id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

## Common Permissions

Here are some common permission strings that can be used:

### Project Permissions
- `project:create` - Create new projects
- `project:update` - Update project details
- `project:delete` - Delete projects
- `project:view` - View projects

### Task Permissions
- `task:create` - Create new tasks
- `task:update` - Update task details
- `task:delete` - Delete tasks
- `task:manage` - Full task management

### Team Permissions
- `team:create` - Create new teams
- `team:update` - Update team details
- `team:delete` - Delete teams
- `team:manage-members` - Add/remove team members

### User Permissions
- `user:create` - Create company users
- `user:update` - Update user details
- `user:delete` - Delete users
- `user:view` - View user details

### Admin Permissions
- `admin` - Full administrative access
