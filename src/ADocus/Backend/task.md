Below is the complete **Markdown documentation file** for the `task_visuals` collection and `TaskVisual` model, including schema design, field explanations, data flow, and example documents for both `individual` and `team` modes.

You can save this as:

```
task_visuals.module.md
```

---

# 📊 Task Visuals Module Documentation

## Collection Name

`task_visuals`

## Model Name

`TaskVisual`

---

# 1. 📌 Purpose

The `task_visuals` collection stores structured visualization configurations and aggregated datasets used for rendering dashboard charts.

It supports:

* Individual dashboard analytics
* Team-based analytics
* Overview summaries
* Filter-based visual insights
* Pre-aggregated chart-ready data

This structure allows:

* Flexible chart types
* Mode-based segregation (individual vs team)
* Backend-driven chart datasets
* Dynamic filters support

---

# 2. 🧱 Schema Design (NestJS + Mongoose)

```ts
@Schema({ timestamps: true })
export class TaskVisual {

  @Prop({ required: true })
  title: string;
  // Display name of the chart

  @Prop({ required: true })
  type: string;
  // task_status | priority | workload | completion_trend | overdue | productivity

  @Prop({ required: true, enum: ['individual', 'team'] })
  mode: 'individual' | 'team';

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
  // Required when mode = individual

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;
  // Required when mode = team

  @Prop({ required: true })
  chartType: string;
  // pie | doughnut | bar | stacked_bar | line | area

  @Prop({ type: Object, required: true })
  data: any;
  // Chart-ready formatted dataset

  @Prop({ type: Object, default: {} })
  filters?: {
    dateRange?: string;     // weekly | monthly | yearly | custom
    priority?: string[];    // High | Medium | Low
    status?: string[];      // Todo | In Progress | Completed | Overdue
  };

  @Prop({ default: true })
  isActive: boolean;
}
```

---

# 3. 🧩 Field Explanation

| Field      | Type     | Description                                 |
| ---------- | -------- | ------------------------------------------- |
| title      | string   | Chart display name                          |
| type       | string   | Logical category of visual                  |
| mode       | enum     | Defines if visual is for individual or team |
| userId     | ObjectId | Required for individual mode                |
| teamId     | ObjectId | Required for team mode                      |
| chartType  | string   | Defines chart rendering type                |
| data       | object   | Pre-formatted dataset for frontend          |
| filters    | object   | Applied filter metadata                     |
| isActive   | boolean  | Toggle visibility                           |
| timestamps | auto     | createdAt & updatedAt                       |

---

# 4. 📈 Supported Visual Types

## task_status

Distribution of tasks by status.

## priority

Task distribution by priority level.

## workload

Tasks assigned per user (team mode).

## completion_trend

Task completion trend over time.

## overdue

Overdue tasks tracking.

## productivity

Tasks completed per member comparison.

---

# 5. 📊 Example Documents

---

# 🔹 Example 1 — Individual Mode

### Use Case

Show logged-in user's task distribution by status.

```json
{
  "_id": "661a001ab23ff45c9a1d0101",
  "title": "My Task Status Overview",
  "type": "task_status",
  "mode": "individual",
  "userId": "65ffabc987654321abcd0001",
  "chartType": "doughnut",
  "data": {
    "labels": ["Todo", "In Progress", "Completed", "Overdue"],
    "datasets": [
      {
        "data": [12, 8, 20, 3]
      }
    ]
  },
  "filters": {
    "dateRange": "monthly"
  },
  "isActive": true,
  "createdAt": "2026-03-25T10:30:00Z",
  "updatedAt": "2026-03-25T10:30:00Z"
}
```

---

# 🔹 Example 2 — Team Mode

### Use Case

Show task status distribution for an entire team.

```json
{
  "_id": "661a001ab23ff45c9a1d0102",
  "title": "Team Task Status Overview",
  "type": "task_status",
  "mode": "team",
  "teamId": "660abcde987654321abc0002",
  "chartType": "bar",
  "data": {
    "labels": ["Todo", "In Progress", "Completed", "Overdue"],
    "datasets": [
      {
        "label": "Team Tasks",
        "data": [35, 18, 60, 7]
      }
    ]
  },
  "filters": {
    "dateRange": "weekly"
  },
  "isActive": true,
  "createdAt": "2026-03-25T10:45:00Z",
  "updatedAt": "2026-03-25T10:45:00Z"
}
```

---

# 🔹 Example 3 — Team Productivity Comparison

### Use Case

Compare completed tasks per team member.

```json
{
  "_id": "661a001ab23ff45c9a1d0103",
  "title": "Team Productivity",
  "type": "productivity",
  "mode": "team",
  "teamId": "660abcde987654321abc0002",
  "chartType": "bar",
  "data": {
    "labels": ["Amit", "Rahul", "Sneha", "Priya"],
    "datasets": [
      {
        "label": "Completed Tasks",
        "data": [15, 22, 18, 10]
      }
    ]
  },
  "filters": {
    "dateRange": "monthly"
  },
  "isActive": true
}
```

---

# 🔹 Example 4 — Completion Trend (Individual)

### Use Case

Show daily completed tasks trend.

```json
{
  "_id": "661a001ab23ff45c9a1d0104",
  "title": "My Completion Trend",
  "type": "completion_trend",
  "mode": "individual",
  "userId": "65ffabc987654321abcd0001",
  "chartType": "line",
  "data": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "datasets": [
      {
        "label": "Completed Tasks",
        "data": [2, 5, 3, 6, 4]
      }
    ]
  },
  "filters": {
    "dateRange": "weekly"
  },
  "isActive": true
}
```

---

# 6. 🔁 Backend Data Flow

1. Planner tasks collection stores raw tasks.
2. Aggregation pipeline computes grouped counts.
3. Aggregated result formatted into chart-ready structure.
4. Stored in `task_visuals`.
5. Frontend fetches and renders using:

   * Chart.js
   * Highcharts
   * Recharts

---

# 7. 🎯 Recommended Chart Types Per Type

| Type             | Recommended Chart |
| ---------------- | ----------------- |
| task_status      | Doughnut / Pie    |
| priority         | Pie / Bar         |
| workload         | Stacked Bar       |
| completion_trend | Line / Area       |
| overdue          | Bar               |
| productivity     | Bar               |

---

# 8. 🚀 Why This Architecture Works

* Clean separation of raw data and analytics
* Scalable for enterprise dashboards
* Supports multi-tenant teams
* Pre-aggregated for performance
* Flexible for filters
* Frontend-ready data structure

---

