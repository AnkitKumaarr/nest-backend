# Overview API Documentation

## Endpoint
`POST /api/analytics-snapshot/overview`

## Description
Returns overview analytics data with optional filters for dateRange, teamId, and userId.

## Authentication
Requires authentication via `Authorization: Bearer {token}` header (protected by CustomAuthGuard).

## Request Body (Optional)
```typescript
{
  dateRange?: {
    startDate?: string;  // ISO date string (e.g., "2026-04-15")
    endDate?: string;    // ISO date string (e.g., "2026-04-22")
  };
  teamId?: string;
  userId?: string;
}
```

All fields are optional. Any combination can be passed.

## Response
```typescript
{
  tasks: {
    total: number;
    today: number;
    inProgress: number;
    completed: number;
    todo: number;
    data: { date: string; count: number }[]; // Task completion trend graph data
  };
  meetings: {
    total: number;
    today: number;
    completed: number;
    inbetween: number;
    notAttended: number;
    data: { date: string; count: number }[]; // Meeting trend graph data
  };
}
```

## Usage Examples

### Using fetch

#### Empty payload (returns data for logged-in user, last 30 days)
```typescript
const response = await fetch('/api/analytics-snapshot/overview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`
  },
  body: JSON.stringify({})
});

const data = await response.json();
```

#### With dateRange filter
```typescript
const response = await fetch('/api/analytics-snapshot/overview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`
  },
  body: JSON.stringify({
    dateRange: {
      startDate: '2026-04-15',
      endDate: '2026-04-22'
    }
  })
});

const data = await response.json();
```

#### With teamId filter
```typescript
const response = await fetch('/api/analytics-snapshot/overview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`
  },
  body: JSON.stringify({
    teamId: 'team-123'
  })
});

const data = await response.json();
```

#### With userId filter
```typescript
const response = await fetch('/api/analytics-snapshot/overview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`
  },
  body: JSON.stringify({
    userId: 'user-456'
  })
});

const data = await response.json();
```

#### Combined filters
```typescript
const response = await fetch('/api/analytics-snapshot/overview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`
  },
  body: JSON.stringify({
    dateRange: {
      startDate: '2026-04-01',
      endDate: '2026-04-30'
    },
    teamId: 'team-123'
  })
});

const data = await response.json();
```

### Using axios

#### Empty payload
```typescript
import axios from 'axios';

const { data } = await axios.post('/api/analytics-snapshot/overview', {}, {
  headers: { Authorization: `Bearer ${yourAuthToken}` }
});
```

#### With filters
```typescript
const { data } = await axios.post('/api/analytics-snapshot/overview', {
  dateRange: { startDate: '2026-04-15', endDate: '2026-04-22' },
  teamId: 'team-123'
}, {
  headers: { Authorization: `Bearer ${yourAuthToken}` }
});
```

## Behavior Notes

- When payload is empty or no userId is provided, the API uses the logged-in user's ID from the authentication token
- When no dateRange is provided, the API defaults to the last 30 days (1 month)
- When teamId is provided, the data is filtered for that team
- Any combination of filters can be used together
- Graph data arrays are sorted by date and include task completion trend and meeting frequency
