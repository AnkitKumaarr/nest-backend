# 📌 Calendar System Architecture Specification

## NestJS + Prisma 6.19 + MongoDB

## Scalable Relational Modeling (Separated Collections)

---

# 🎯 Objective

Design a scalable calendar system using **relational modeling in MongoDB via Prisma**, avoiding deep embedded documents.

This architecture ensures:

* High-performance queries
* Clean updates
* Proper indexing
* Scalable structure
* No positional array update complexity
* Clean `findAll` APIs

---

# 🏗 Final Architecture

```
UserCalendar (1 per user per month per year)
    ↳ Week (N)
        ↳ Day (N)
            ↳ DayTask (N)
```

Each entity is stored in its own collection.

No nested embedded arrays.

---

# 🧱 Prisma Schema (Complete)

Open:

```
prisma/schema.prisma
```

---

## 1️⃣ Datasource + Generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

---

# 2️⃣ UserCalendar Model

```prisma
model UserCalendar {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  userId    String   @db.ObjectId
  year      Int
  month     Int   // 1-12

  weeks     Week[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([userId, year, month])
}
```

### Purpose

* One document per user per month per year
* Fast lookup using composite index
* Entry point for full-month aggregation

---

# 3️⃣ Week Model

```prisma
model Week {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId

  calendarId  String   @db.ObjectId
  calendar    UserCalendar @relation(fields: [calendarId], references: [id], onDelete: Cascade)

  weekNumber  Int
  startDate   DateTime
  endDate     DateTime

  days        Day[]

  @@index([calendarId])
  @@index([calendarId, weekNumber])
  @@index([startDate])
}
```

### Purpose

* Store weeks independently
* Enables fast date-range queries
* Enables fetching weeks by calendarId

---

# 4️⃣ Day Model

```prisma
model Day {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  weekId    String   @db.ObjectId
  week      Week     @relation(fields: [weekId], references: [id], onDelete: Cascade)

  name      String
  date      DateTime

  tasks     DayTask[]

  @@index([weekId])
  @@index([date])
}
```

### Purpose

* Direct day lookup by ID
* Direct day lookup by date
* No need to scan full month

---

# 5️⃣ Task Enums

```prisma
enum TaskStatus {
  TODO         @map("todo")
  IN_PROGRESS  @map("in-progress")
  BLOCKED      @map("blocked")
  DONE         @map("done")
}

enum TaskPriority {
  LOW      @map("low")
  MEDIUM   @map("medium")
  HIGH     @map("high")
  CRITICAL @map("critical")
}
```

---

# 6️⃣ DayTask Model

```prisma
model DayTask {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId

  dayId           String   @db.ObjectId
  day             Day      @relation(fields: [dayId], references: [id], onDelete: Cascade)

  title           String

  descriptionHtml String?
  descPreview     String?

  blockerHtml     String?
  blockerPreview  String?

  startDate       DateTime?
  dueDate         DateTime?

  priority        TaskPriority @default(MEDIUM)
  status          TaskStatus   @default(TODO)

  assignedToId    String? @db.ObjectId
  assignedTo      User?   @relation(fields: [assignedToId], references: [id])

  order           Int

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([dayId])
  @@index([dayId, order])
  @@index([assignedToId])
  @@index([status])
  @@index([dueDate])
}
```

---

# 7️⃣ Optional User Model (For Assignment)

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  name  String
  email String @unique

  tasks DayTask[]
}
```

---

# 🚀 Why This Architecture Is Scalable

## Old Embedded Structure Problem

```
UserCalendar
  └─ month
       └─ weeks[]
            └─ days[]
```

Problems:

* Hard updates
* Deep array positional operators
* Large document size
* Limited indexing
* Poor concurrency

---

## New Normalized Structure Benefits

| Operation              | Performance    |
| ---------------------- | -------------- |
| Fetch full month       | via calendarId |
| Fetch single week      | via weekId     |
| Fetch single day       | direct find    |
| Update task            | atomic update  |
| Index by date          | fast           |
| Index by assigned user | fast           |
| Add 10k+ tasks         | safe           |

---

# 📦 Query Patterns

---

## Get Full Month

```ts
await prisma.userCalendar.findFirst({
  where: { userId, year, month },
  include: {
    weeks: {
      include: {
        days: {
          include: { tasks: true }
        }
      }
    }
  }
});
```

---

## Get Single Day

```ts
await prisma.day.findUnique({
  where: { id: dayId },
  include: { tasks: true }
});
```

---

## Get Tasks of a Day

```ts
await prisma.dayTask.findMany({
  where: { dayId },
  orderBy: { order: "asc" }
});
```

---

## Get Overdue Tasks

```ts
await prisma.dayTask.findMany({
  where: {
    dueDate: { lt: new Date() },
    status: { not: "DONE" }
  }
});
```

---

# 🔥 Index Strategy Summary

| Collection   | Index                 |
| ------------ | --------------------- |
| UserCalendar | userId                |
| UserCalendar | userId + year + month |
| Week         | calendarId            |
| Week         | startDate             |
| Day          | weekId                |
| Day          | date                  |
| DayTask      | dayId                 |
| DayTask      | assignedToId          |
| DayTask      | status                |
| DayTask      | dueDate               |

These indexes ensure performance at scale.

---

# 🛠 Setup Commands

After updating schema:

```bash
npx prisma generate
npx prisma db push
```

If using migrations:

```bash
npx prisma migrate dev --name calendar_relational_structure
```

---

# 🔒 API Compatibility

* No change required in `findAll`
* No response contract change
* No nested document rewrites
* Safe to scale to enterprise usage

---

# 🧠 Design Principles Applied

* Relational modeling in Mongo
* Proper indexing strategy
* Atomic updates
* Scalable task management
* Optimized list performance via preview fields
* Clean separation of entities

---

# ✅ Final Result

You now have a:

* Production-ready calendar system
* Scalable multi-user safe structure
* Index-optimized architecture
* NestJS + Prisma compatible design
* Clean separation of concerns
* Enterprise extensibility ready

---

END OF ARCHITECTURE SPEC
