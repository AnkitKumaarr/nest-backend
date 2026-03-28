# OVERVIEW DASHBOARD

## Task & Meeting Management System

---

# 1. Purpose

The Overview Dashboard provides a consolidated snapshot of tasks, meetings, and overall productivity across the system.

It is the default landing page after login.

---

# 2. Layout Structure

1. Header Section

   * Dashboard Title
   * Date Range Filter
   * Team Selector (optional)
   * Export Button

2. KPI Summary Cards Row

3. Primary Analytics Section

4. Secondary Comparative Section

5. Recent Activity Table

---

# 3. KPI Summary Cards

Recommended 6–8 Cards:

* Total Tasks
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Total Meetings
* Upcoming Meetings
* Active Members
* Completion Rate (%)

Each card should show:

* Main metric
* Trend indicator (↑ ↓ % change)
* Small sparkline (optional)

---

# 4. Charts

## 4.1 Task Status Distribution

Type: Doughnut Chart
Represents:

* Completed
* In Progress
* Pending
* Overdue

Purpose: Visual proportion analysis.

---

## 4.2 Task Completion Trend (Last 30 Days)

Type: Line Chart
X-axis: Date
Y-axis: Completed Tasks

Purpose: Productivity trend monitoring.

---

## 4.3 Meetings vs Tasks Comparison

Type: Grouped Bar Chart
X-axis: Weeks
Y-axis: Count

Bars:

* Tasks Created
* Meetings Conducted

Purpose: Workload comparison.

---

## 4.4 Team Contribution

Type: Horizontal Bar Chart
Y-axis: Members
X-axis: Completed Tasks

Purpose: Member performance visibility.

---

# 5. Data Requirements (Backend - NestJS)

Required endpoints:

* GET /dashboard/overview
* GET /dashboard/trends
* GET /dashboard/comparison

Support:

* Date range filter
* Team filter

Use MongoDB aggregation for:

* Status grouping
* Weekly trends

---

# 6. Recommended Chart Count

4–6 charts maximum.

Keep dashboard clean and executive-level.

---

# End of Overview Dashboard Document
