# MEETINGS DASHBOARD

## Task & Meeting Management System

---

# 1. Purpose

Tracks meeting performance, scheduling patterns, attendance, and duration analysis.

---

# 2. Layout Structure

1. Header

   * Date Filter
   * Meeting Type Filter
   * Team Filter

2. KPI Cards

3. Attendance Analytics

4. Scheduling Analytics

5. Meeting History Table

---

# 3. KPI Summary Cards

* Total Meetings
* Upcoming Meetings
* Completed Meetings
* Cancelled Meetings
* Average Duration
* Attendance Rate (%)

---

# 4. Charts

## 4.1 Meetings Trend (Monthly)

Type: Line Chart

## 4.2 Attendance Distribution

Type: Doughnut Chart
Attended / Missed

## 4.3 Member Attendance Comparison

Type: Horizontal Bar Chart

## 4.4 Meeting Duration Analysis

Type: Column Chart
X-axis: Meeting
Y-axis: Duration (minutes)

## 4.5 Meeting Type Breakdown

Type: Pie Chart
Internal / Client / Review / Planning

---

# 5. Backend Data Requirements

Endpoints:

* GET /meetings/summary
* GET /meetings/trends
* GET /meetings/attendance
* GET /meetings/types

Aggregation needed for:

* Attendance rate
* Duration average
* Member grouping

---

# 6. Recommended Chart Count

4–6 charts.

Keep it structured and readable.

---

# End of Meetings Dashboard Document
