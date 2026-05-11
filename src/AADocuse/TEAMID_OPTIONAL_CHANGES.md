# teamId Optional Changes - API Updates

This document outlines all the changes made to make `teamId` optional across the application APIs, allowing endpoints to return data for entire companies when no specific team is provided.

## Summary of Changes

The following endpoints have been updated to make `teamId` optional:

### 1. Team Members API

#### Endpoint: `GET /api/v1/team-members`
- **Before**: Required `teamId` query parameter
- **After**: Optional `teamId` query parameter
- **Behavior**: 
  - With `teamId`: Returns members of specific team
  - Without `teamId`: Returns all team members for the company

#### Files Changed:
- `src/team-members/dto/team-member.dto.ts`
  - `ListTeamMembersDto`: Made `teamId` optional (removed `@IsNotEmpty()`, added `@IsOptional()`)
- `src/team-members/team-members.service.ts`
  - `listMembers()`: Updated logic to handle optional `teamId`
  - When `teamId` not provided, filters by `companyId` instead
  - Maintains team validation when `teamId` is provided

### 2. Teams API

#### Files Changed:
- No changes needed as `ListTeamsDto` already had optional `teamId`
- Removed unused `ListMembersDto` class from `src/teams/dto/list-teams.dto.ts`

### 3. Projects API

#### Endpoint: `GET /api/v1/projects`
- **Before**: Required `teamId` in `ListProjectsDto`
- **After**: Optional `teamId` in `ListProjectsDto`
- **Behavior**: 
  - With `teamId`: Returns projects for specific team
  - Without `teamId`: Returns all projects for the company

#### Files Changed:
- `src/projects/dto/project.dto.ts`
  - `ListProjectsDto`: Already had optional `teamId` (no changes needed)
- `src/projects/projects.service.ts`
  - `list()`: Already handles optional `teamId` correctly (no changes needed)

#### Endpoint: `POST /api/v1/projects` & `PATCH /api/v1/projects/:id`
- **Before**: Required `teamId` in create/update DTOs
- **After**: Optional `teamId` in both `CreateProjectDto` and `UpdateProjectDto`

#### Files Changed:
- `src/projects/dto/project.dto.ts`
  - `CreateProjectDto`: Made `teamId` optional
  - `UpdateProjectDto`: Added optional `teamId` field
- `src/projects/projects.service.ts`
  - `create()`: Updated to handle optional `teamId` (conditional inclusion)
  - `update()`: Updated to handle optional `teamId` updates

### 4. Project Tasks API

#### Endpoint: `GET /api/v1/project-tasks`
- **Before**: Required `teamId` in `ListProjectTasksDto`
- **After**: Optional `teamId` in `ListProjectTasksDto`
- **Behavior**: 
  - With `teamId`: Returns tasks for specific team
  - Without `teamId`: Returns all tasks for the company

#### Files Changed:
- `src/project-tasks/dto/list-project-tasks.dto.ts`
  - Already had optional `teamId` (no changes needed)
- `src/project-tasks/dto/create-project-task.dto.ts`
  - Already had optional `teamId` (no changes needed)
- `src/project-tasks/dto/update-project-task.dto.ts`
  - Already had optional `teamId` (no changes needed)
- `src/project-tasks/project-tasks.service.ts`
  - `findAll()`: Already handles optional `teamId` correctly (no changes needed)

### 5. Company Users API

#### Endpoint: `GET /api/v1/company-users`
- **Before**: Required `teamId` in `FilterCompanyUsersDto`
- **After**: Optional `teamId` in `FilterCompanyUsersDto`
- **Behavior**: 
  - With `teamId`: Returns users for specific team
  - Without `teamId`: Returns all users for the company

#### Files Changed:
- `src/company-users/dto/filter-company-users.dto.ts`
  - Made `teamId` optional (removed `@IsNotEmpty()`, added `@IsOptional()`)
- `src/company-users/company-users.controller.ts`
  - `findAll()`: Updated to extract `companyId` from token instead of query parameter

### 6. Analytics Snapshots API

#### Endpoint: `GET /api/v1/analytics-snapshots/overview`
- **Before**: Required `teamId` query parameter
- **After**: Optional `teamId` query parameter
- **Behavior**: 
  - With `teamId`: Returns analytics for specific team
  - Without `teamId`: Returns analytics for entire company

#### Files Changed:
- `src/analytics-snapshots/dto/overview.dto.ts`
  - Already had optional `teamId` (no changes needed)
- `src/analytics-snapshots/analytics-snapshots.controller.ts`
  - `getOverview()`: Already handles optional `teamId` correctly (no changes needed)

## Endpoints Unchanged (Appropriately Team-Specific)

The following endpoints correctly use `teamId` as path parameters and were not changed:

### Task Snapshots API
- `GET /api/v1/task-snapshots/team/:teamId/status`
- `GET /api/v1/task-snapshots/team/:teamId/priority`
- `GET /api/v1/task-snapshots/team/:teamId/workload`
- `GET /api/v1/task-snapshots/team/:teamId/completion-trend`
- `GET /api/v1/task-snapshots/team/:teamId/overdue`
- `GET /api/v1/task-snapshots/team/:teamId/productivity`

### Analytics Snapshots API
- `GET /api/v1/analytics-snapshots/teams/:teamId`

### Teams API
- `GET /api/v1/teams/:teamId`
- `GET /api/v1/teams/:teamId/insights`
- `PATCH /api/v1/teams/:teamId`
- `DELETE /api/v1/teams/:teamId`

## Implementation Pattern

The consistent pattern implemented across all endpoints:

1. **DTO Changes**: Made `teamId` optional by:
   - Removing `@IsNotEmpty()` decorator
   - Adding `@IsOptional()` decorator
   - Changing type from `teamId: string` to `teamId?: string`

2. **Service Logic**: Updated to handle optional `teamId`:
   ```typescript
   if (dto.teamId) {
     // Filter by specific team and validate team exists
     where.teamId = dto.teamId;
   } else {
     // Return all records for the company
     where.companyId = companyId;
   }
   ```

3. **Controller Updates**: Where needed, ensured `companyId` is extracted from JWT token rather than query parameters.

## Benefits

- **Flexibility**: APIs can now return company-wide data when no team is specified
- **Backward Compatibility**: Existing integrations continue to work with team-specific queries
- **Consistency**: Uniform behavior across all listing endpoints
- **Security**: Company scoping maintained through JWT token extraction

## Testing Recommendations

Test the following scenarios for each updated endpoint:

1. **With teamId**: Verify team-specific filtering works correctly
2. **Without teamId**: Verify company-wide data is returned
3. **Invalid teamId**: Verify appropriate error handling
4. **Authentication**: Verify proper company scoping is maintained
