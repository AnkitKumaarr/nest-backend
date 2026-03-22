// ── Global defaults (seeded once, no companyId) ───────────────────────────────

export const DEFAULT_COLUMNS = [
  { name: 'TODO',         label: 'TODO',         value: 'todo',         isDefault: true },
  { name: 'INPROGRESS',   label: 'INPROGRESS',   value: 'inprogress',   isDefault: true },
  { name: 'SELF TESTING', label: 'SELF TESTING', value: 'self testing', isDefault: true },
  { name: 'BLOCKER',      label: 'BLOCKER',      value: 'blocker',      isDefault: true },
  { name: 'QA READY',     label: 'QA READY',     value: 'qa ready',     isDefault: true },
  { name: 'DONE',         label: 'DONE',         value: 'done',         isDefault: true },
];

export const DEFAULT_STATUSES = [
  { name: 'Todo',        label: 'Todo',        value: 'todo',        isDefault: true },
  { name: 'In Progress', label: 'In Progress', value: 'in progress', isDefault: true },
  { name: 'Completed',   label: 'Completed',   value: 'completed',   isDefault: true },
  { name: 'Unassigned',  label: 'Unassigned',  value: 'unassigned',  isDefault: true },
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
      'column:create', 'column:delete',
    ],
  },
  {
    name: 'Team Lead',
    permissions: [
      'task:create', 'task:edit', 'task:delete', 'task:view',
      'team:manage-members', 'team:view',
      'project:view',
      'user:view',
      'column:create', 'column:delete',
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
