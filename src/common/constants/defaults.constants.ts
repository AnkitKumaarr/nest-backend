// ── Global defaults (seeded once, no companyId) ───────────────────────────────

export const DEFAULT_STATUSES = [
  { name: 'Backlog',     label: 'Backlog',     value: 'backlog',     isDefault: true, order: 1 },
  { name: 'Todo',        label: 'Todo',        value: 'todo',        isDefault: true, order: 2 },
  { name: 'In Progress', label: 'In Progress', value: 'in progress', isDefault: true, order: 3 },
  { name: 'Completed',   label: 'Completed',   value: 'completed',   isDefault: true, order: 4 },
];

export const DEFAULT_PRIORITIES = [
  { name: 'Urgent',     label: 'Urgent',     value: 'urgent',     isDefault: true },
  { name: 'High',       label: 'High',       value: 'high',       isDefault: true },
  { name: 'Medium',     label: 'Medium',     value: 'medium',     isDefault: true },
  { name: 'Low',        label: 'Low',        value: 'low',        isDefault: true },
  { name: 'Unassigned', label: 'Unassigned', value: 'unassigned', isDefault: true },
];

// ── Default roles + permissions seeded per company ────────────────────────────

export const DEFAULT_ROLES: { name: string; permissions: string[] }[] = [
  {
    name: 'Admin',
    permissions: ['*'],
  },
  {
    name: 'Manager',
    permissions: [
      'task:create', 'task:edit', 'task:delete', 'task:view',
      'team:manage-members', 'team:view',
      'project:create', 'project:edit', 'project:view',
      'user:view', 'user:create', 'user:edit',
      'role:view',
    ],
  },
  {
    name: 'Team Lead',
    permissions: [
      'task:create', 'task:edit', 'task:delete', 'task:view',
      'team:manage-members', 'team:view',
      'project:view',
      'user:view',
    ],
  },
  {
    name: 'Business Analyst',
    permissions: [
      'task:create', 'task:edit', 'task:view',
      'team:view',
      'project:view',
      'user:view',
    ],
  },
  {
    name: 'Developer',
    permissions: [
      'task:create', 'task:edit', 'task:view',
      'team:view',
      'project:view',
    ],
  },
  {
    name: 'QA Engineer',
    permissions: [
      'task:create', 'task:edit', 'task:view',
      'team:view',
      'project:view',
    ],
  },
  {
    name: 'Sales Lead',
    permissions: [
      'task:create', 'task:edit', 'task:view',
      'team:view',
      'project:view',
      'user:view',
    ],
  },
  {
    name: 'HR',
    permissions: [
      'user:view', 'user:create', 'user:edit',
      'team:view',
      'role:view',
    ],
  },
  {
    name: 'Employee',
    permissions: [
      'task:create', 'task:edit', 'task:view',
      'team:view',
    ],
  },
  {
    name: 'User',
    permissions: [
      'task:view',
      'team:view',
    ],
  },
];
