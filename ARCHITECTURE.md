# 📚 SMS — School Management System: Complete Architecture Guide

> A multi-tenant SaaS platform for managing schools. Built with a **Node.js/TypeScript** backend and a **Next.js 16** frontend.

---

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Backend Deep Dive](#4-backend-deep-dive)
   - [Config & Environment](#41-config--environment)
   - [Middleware Pipeline](#42-middleware-pipeline)
   - [Authentication & Authorization Flow](#43-authentication--authorization-flow)
   - [Multi-Tenancy (School Isolation)](#44-multi-tenancy-school-isolation)
   - [API Routes Map](#45-api-routes-map)
5. [Database Schema (All 24 Models)](#5-database-schema-all-24-models)
6. [Service Layer](#6-service-layer)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [Complete Feature Flows](#8-complete-feature-flows)
   - [Login Flow](#81-login-flow)
   - [Student Admission Flow](#82-student-admission-flow)
   - [Fee Collection Flow](#83-fee-collection-flow)
   - [Salary Processing Flow](#84-salary-processing-flow)
   - [Exam & Result Flow](#85-exam--result-flow)
   - [Timetable Flow](#86-timetable-flow)
   - [Subscription & Payment Flow (Razorpay)](#87-subscription--payment-flow-razorpay)
   - [Notification Flow (SMS / Email)](#88-notification-flow)
   - [AI Assistant Flow](#89-ai-assistant-flow)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                     │
│              Next.js 16 (App Router, Turbopack)         │
│           http://localhost:3000  (or Vercel)            │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS + JWT in Authorization header
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                    │
│         Express.js + TypeScript  (Port 5001)            │
│                                                         │
│  ┌───────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │ Middleware │  │  Routes    │  │   Controllers      │ │
│  │ (auth,    │→ │ /api/v1/.. │→ │ (business logic)   │ │
│  │  cors,    │  │            │  │                    │ │
│  │  rate-    │  └────────────┘  └────────┬───────────┘ │
│  │  limit)   │                           │             │
│  └───────────┘                           ▼             │
│                                  ┌────────────────────┐ │
│                                  │   Service Layer    │ │
│                                  │ (fee, salary, ai,  │ │
│                                  │  pdf, twilio, etc) │ │
│                                  └────────┬───────────┘ │
└───────────────────────────────────────────┼─────────────┘
                                            │
              ┌─────────────────────────────┼──────────────────┐
              │                             │                  │
              ▼                             ▼                  ▼
    ┌──────────────────┐         ┌──────────────┐   ┌────────────────┐
    │     MongoDB      │         │  Cloudinary  │   │  Third-party   │
    │  (Mongoose ODM)  │         │ (File/Images │   │  Twilio / Gmail│
    │   ssms-db        │         │  Storage)    │   │  Razorpay/     │
    └──────────────────┘         └──────────────┘   │  PhonePe / AI  │
                                                    └────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB (via Mongoose ODM) |
| **Auth** | JWT (Access Token 15m + Refresh Token 7d) |
| **File Storage** | Cloudinary (supports multiple accounts) |
| **PDF Generation** | PDFKit |
| **SMS** | Twilio |
| **Email** | Gmail API (via googleapis) |
| **Payments** | Razorpay (subscriptions) + PhonePe |
| **AI** | Google Gemini API + Groq (llama-3.3-70b) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, bcryptjs |
| **Dev Tools** | ts-node, nodemon, jest, eslint, prettier |

---

## 3. Project Structure

### Backend (`SMS-Backend-main/`)
```
src/
├── config/
│   ├── index.ts          ← All env vars typed and exported as single config object
│   └── database.ts       ← MongoDB connection with Mongoose
├── controllers/          ← HTTP request handlers (19 files)
├── middleware/
│   ├── auth.middleware.ts     ← protect() + authorize() + multitenant()
│   ├── error.middleware.ts    ← Global error handler
│   ├── upload.middleware.ts   ← Multer config for file uploads
│   └── validate.middleware.ts ← Zod/express-validator request validation
├── models/               ← 24 Mongoose schemas (see Section 5)
├── repositories/         ← Data access layer (11 files)
├── routes/               ← 22 Express routers
├── schemas/              ← Zod input validation schemas
├── services/             ← Business logic (18 files)
├── types/                ← TypeScript interfaces & enums
├── utils/                ← Helpers: errorResponse, seeder, PDF, etc.
└── server.ts             ← Express app bootstrap
```

### Frontend (`SMS-Frontend-main/`)
```
app/
├── (auth)/               ← Login pages (public)
├── (dashboard)/          ← All protected pages (school admin)
│   ├── school/           ← School dashboard
│   ├── students/         ← Student management
│   ├── fees/             ← Fee management (4 sub-pages)
│   ├── staff/            ← Staff management (3 sub-pages)
│   ├── payroll/          ← Salary management
│   ├── exams/            ← Exam management
│   ├── admit-cards/      ← Admit card generator
│   ├── timetable/        ← Timetable builder (5 sub-pages)
│   ├── classes/          ← Class management
│   ├── sessions/         ← Academic session management
│   ├── transport/        ← Bus/transport management
│   ├── notifications/    ← SMS/Email blasts
│   ├── promotion/        ← Student promotion to next class
│   ├── settings/         ← School settings
│   ├── support/          ← Support tickets
│   ├── plan/             ← Subscription plan
│   └── master/           ← Super Admin panel (10 sub-pages)
components/               ← 43 reusable UI components
context/                  ← React context (auth context)
store/                    ← State management
lib/                      ← Utility functions, API client
types/                    ← TypeScript types
```

---

## 4. Backend Deep Dive

### 4.1 Config & Environment

All environment variables are read once in `src/config/index.ts` and exported as a strongly-typed `IConfig` object. No raw `process.env` calls anywhere else.

**Required `.env` variables:**
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 4.2 Middleware Pipeline

Every request flows through this pipeline in order:

```
Request
  │
  ├─ 1. helmet()             → Security headers
  ├─ 2. cors()               → CORS (allows configured origins + *.vercel.app)
  ├─ 3. express.raw()        → Raw body for Razorpay webhook only
  ├─ 4. express.json()       → Parse JSON body (limit: 10kb)
  ├─ 5. express.urlencoded() → Parse form data
  ├─ 6. cookieParser()       → Parse cookies
  ├─ 7. mongoSanitize()      → Strip $ and . from inputs (NoSQL injection prevention)
  ├─ 8. sanitizeStrings()    → Strip <script>, onerror=, javascript: (XSS prevention)
  ├─ 9. compression()        → GZIP responses
  ├─ 10. rateLimit()         → 100 req/15min on /api, 20 req/15min on /auth
  │
  ├─ Route Handler:
  │    ├─ protect()          → Verify JWT access token
  │    ├─ authorize(roles)   → Check user role
  │    └─ multitenant()      → Enforce school data isolation
  │
  ├─ Controller             → Business logic
  │
  └─ errorHandler()         → Centralized error formatting
```

### 4.3 Authentication & Authorization Flow

```
POST /api/v1/auth/login
  │
  ├─ 1. Validate email + password fields
  ├─ 2. AuthService.login()
  │    ├─ Find user by email (with +password select)
  │    ├─ bcrypt.compare(enteredPassword, hashedPassword)
  │    ├─ Generate Access Token (JWT, 15 min, includes: id, role, schoolId)
  │    ├─ Generate Refresh Token (JWT, 7 days, includes: id only)
  │    └─ Save refresh token hash to user doc
  ├─ 3. Portal check: portal=master → only SUPER_ADMIN; portal=school → non-SUPER_ADMIN
  ├─ 4. Return: { accessToken, refreshToken, role, redirectTo, user }
  │
  └─ Client stores tokens → sends in Authorization: Bearer <accessToken>

Token Refresh:
POST /api/v1/auth/refresh
  ├─ Validate refresh token (JWT verify with refreshSecret)
  ├─ Check token matches stored hash in DB
  ├─ Issue new access + refresh token pair
  └─ Return new tokens

Protected Route Pattern:
  protect() → authorize('school_admin', 'teacher') → multitenant() → controller
```

**User Roles:**
| Role | Description |
|---|---|
| `super_admin` | Full platform access, manages all schools |
| `school_admin` | Manages their own school (staff, students, fees, etc.) |
| `teacher` | Limited to own class data (timetable, exams) |
| `accountant` | Manages fees and salary |

### 4.4 Multi-Tenancy (School Isolation)

The `multitenant()` middleware enforces strict data isolation:

- **Regular users** (school_admin, teacher, accountant): `req.schoolId` is automatically set to their registered school's ID. Cross-school access attempts return `403 Security Violation`.
- **Super Admin**: Can pass a `schoolId` via `req.query`, `req.body`, or `x-school-id` header to filter to a specific school view, or see all schools if none provided.
- For `POST/PUT/PATCH` requests, `schoolId` is auto-injected into `req.body` from the authenticated user's school — preventing any client-side school ID tampering.

### 4.5 API Routes Map

All routes are prefixed: **`/api/v1/`**

| Prefix | File | Main Purpose |
|---|---|---|
| `/auth` | auth.routes.ts | Login, logout, register, refresh token |
| `/master` | master.routes.ts | Super Admin: schools CRUD, plans, subscriptions, analytics |
| `/schools` | school.routes.ts | School profile get/update |
| `/students` | student.routes.ts | Student CRUD, search, promote, ID cards |
| `/fees` | fee.routes.ts | Fee structure, student fees, payments, receipts |
| `/salaries` | salary.routes.ts | Monthly salary generation, pay, reports |
| `/salary-structure` | salaryStructure.routes.ts | Salary structure templates |
| `/salary-other-payments` | otherPayment.routes.ts | Bonus, deductions outside salary |
| `/users` | user.routes.ts | Staff (teacher/accountant) CRUD |
| `/exams` | exam.routes.ts | Exam creation, result entry, report cards |
| `/transport` | transport.routes.ts | Bus management |
| `/upload` | upload.routes.ts | Cloudinary file upload |
| `/sessions` | session.routes.ts | Academic year sessions |
| `/classes` | class.routes.ts | Class + section management |
| `/timetable` | timetable.routes.ts | Timetable grid, version, settings |
| `/ai` | ai.routes.ts | AI chat assistant (Gemini/Groq) |
| `/payments` | payment.routes.ts | Razorpay order creation + webhook |
| `/notifications` | notification.routes.ts | Bulk SMS/Email to students |
| `/announcements` | announcement.routes.ts | School-wide announcements |
| `/support` | support.routes.ts | Support ticket creation |
| `/health` | health.routes.ts | Health check endpoint |

---

## 5. Database Schema (All 24 Models)

### 5.1 `User` — Staff Members

```
User {
  schoolId:       ObjectId → School   (required unless super_admin)
  name:           String
  email:          String (unique, lowercase)
  password:       String (bcrypt hashed, select: false)
  phone:          String
  role:           Enum [super_admin, school_admin, teacher, accountant]
  photo:          String (Cloudinary URL)
  subject:        String (teacher-specific)
  qualification:  String (teacher-specific)
  baseSalary:     Number (teacher-specific)
  isActive:       Boolean
  lastLogin:      Date
  refreshToken:   String (select: false)
  timestamps      (createdAt, updatedAt)

  Methods:
    matchPassword(entered)   → bcrypt compare
    getSignedJwtToken()      → Access JWT (15m)
    getRefreshToken()        → Refresh JWT (7d)

  Index: { schoolId, role }
}
```

### 5.2 `School` — School Profile

```
School {
  schoolName:         String (unique)
  schoolCode:         String (unique, max 10)
  email:              String
  phone:              String
  logo:               String (Cloudinary URL)
  stamp:              String (Cloudinary URL)
  principalSignature: String (Cloudinary URL)
  address:            { street, city, state, pincode, country }
  principalName:      String
  board:              Enum [CBSE, ICSE, STATE, IB, etc.]
  classRange:         { from: String, to: String }
  sessionStartMonth:  String (default: "April")
  subscriptionPlan:   Enum [free, basic, professional, enterprise]
  subscriptionExpiry: Date
  studentLimit:       Number (default: 500)
  isActive:           Boolean
  settings:           { currency, dateFormat, timezone }
  adminUserId:        ObjectId → User
  timestamps
}
```

### 5.3 `Student` — Student Records

```
Student {
  schoolId:           ObjectId → School
  admissionNumber:    String (uppercase, unique per school)
  sessionId:          ObjectId → Session
  firstName:          String
  lastName:           String
  fatherName:         String
  motherName:         String
  dateOfBirth:        Date
  gender:             Enum [male, female, other]
  bloodGroup:         Enum [A+, A-, B+, B-, O+, O-, AB+, AB-]
  photo:              String (Cloudinary URL)
  address:            { street, city, state, pincode }
  phone:              String
  alternatePhone:     String
  email:              String
  class:              String
  section:            String (uppercase)
  rollNumber:         Number
  admissionDate:      Date
  previousSchool:     String
  tcSubmitted:        Boolean
  tcDocument:         String
  migrationSubmitted: Boolean
  migrationDocument:  String
  birthCertificate:   String
  status:             Enum [active, inactive, transferred, graduated]
  isActive:           Boolean
  usesTransport:      Boolean
  busId:              ObjectId → Bus
  totalYearlyFee:     Number
  paidAmount:         Number
  dueAmount:          Number
  initialDepositAmount: Number
  depositPaymentMode: String
  depositDate:        Date
  timestamps

  Virtual: fullName (firstName + lastName)

  Indexes:
    { schoolId, admissionNumber } UNIQUE
    { schoolId, class, section }
    { schoolId, status }
}
```

### 5.4 `Session` — Academic Year

```
Session {
  schoolId:            ObjectId → School
  sessionYear:         String  (e.g., "2024-2025")
  startDate:           Date
  endDate:             Date
  isActive:            Boolean
  promotionCompleted:  Boolean
  promotionDate:       Date

  Indexes:
    { schoolId, sessionYear } UNIQUE
    { schoolId, isActive }
}
```

### 5.5 `Class` — Class + Section

```
Class {
  schoolId:   ObjectId → School
  name:       String  (e.g., "10", "KG")
  sections:   [String] (e.g., ["A", "B", "C"])
  classTeacherId: ObjectId → User
  timestamps
}
```

### 5.6 `FeeStructure` — Fee Template per Class

```
FeeStructure {
  schoolId:       ObjectId → School
  sessionId:      ObjectId → Session
  classId:        ObjectId → Class
  class:          String
  fees: [{
    title:        String
    type:         Enum [tuition, exam, transport, library, lab, misc, annual]
    amount:       Number
    description:  String
    isOptional:   Boolean
  }]
  components: [{          ← Newer format
    name:   String
    amount: Number
    type:   Enum [monthly, one-time]
  }]
  totalAnnualFee: Number  ← auto-calculated on save
  totalAmount:    Number  ← auto-calculated on save
  isActive:       Boolean

  Pre-save hook: Calculates totalAmount from components (monthly×12 + one-time) or sum of fees[].amount
  Index: { schoolId, sessionId, class } UNIQUE
}
```

### 5.7 `StudentFee` — Monthly Fee Record per Student

```
StudentFee {
  schoolId:       ObjectId → School
  studentId:      ObjectId → Student
  sessionId:      ObjectId → Session
  month:          String  (e.g., "April", "One-Time")
  feeBreakdown:   [{ title, amount, type }]
  totalAmount:    Number
  paidAmount:     Number
  remainingAmount: Number  ← auto-calculated
  status:         Enum [pending, partial, paid, overdue]
  dueDate:        Date
  payments: [{
    amount:         Number
    paymentDate:    Date
    paymentMode:    Enum [cash, upi, bank, cheque, card, online]
    transactionId:  String
    receiptNumber:  String
    receivedBy:     ObjectId → User
    remarks:        String
  }]
  discount:       Number
  discountReason: String
  lateFee:        Number

  Pre-save hook:
    remainingAmount = totalAmount + lateFee - discount - paidAmount
    status = PENDING (paidAmount=0) | PAID (paidAmount>=total) | PARTIAL | OVERDUE (past dueDate)

  Index: { schoolId, studentId, sessionId, month } UNIQUE
}
```

### 5.8 `FeePayment` — Payment Receipt

```
FeePayment {
  schoolId:       ObjectId → School
  studentId:      ObjectId → Student
  classId:        ObjectId → Class
  receiptNumber:  String (unique per school)
  amountPaid:     Number
  paymentMode:    Enum [cash, upi, bank, cheque, card, online]
  paymentDate:    Date
  previousDue:    Number
  remainingDue:   Number
  pdfPath:        String (Cloudinary PDF URL)

  Indexes:
    { schoolId, receiptNumber } UNIQUE
    { schoolId, studentId }
    { schoolId, paymentDate }
}
```

### 5.9 `Salary` — Monthly Staff Salary Record

```
Salary {
  schoolId:     ObjectId → School
  staffId:      ObjectId → User
  month:        String  (e.g., "April-2024")
  year:         Number
  basicSalary:  Number
  allowances:   [{ title, amount }]
  deductions:   [{ title, amount }]
  totalSalary:  Number  (basicSalary + sum of allowances)
  netSalary:    Number  (totalSalary - sum of deductions)
  status:       Enum [pending, paid, cancelled]
  paymentDate:  Date
  paymentMode:  Enum [cash, upi, bank, cheque, card, online]
  transactionId: String
  remarks:      String
  timestamps

  Index: { schoolId, staffId, month, year } UNIQUE
}
```

### 5.10 `SalaryStructure` — Salary Template

```
SalaryStructure {
  schoolId:   ObjectId → School
  staffId:    ObjectId → User
  basicSalary: Number
  allowances:  [{ title, amount }]
  deductions:  [{ title, amount }]
  effectiveFrom: Date
  timestamps
}
```

### 5.11 `Exam` — Exam Definition

```
Exam {
  schoolId:   ObjectId → School
  sessionId:  ObjectId → Session
  title:      String
  type:       Enum [unit_test, quarterly, half_yearly, annual]
  startDate:  Date
  endDate:    Date
  classes:    [String]  ← Which classes this exam applies to
  isActive:   Boolean
  timestamps
}
```

### 5.12 `ExamResult` — Student Exam Result

```
ExamResult {
  schoolId:       ObjectId → School
  examId:         ObjectId → Exam
  studentId:      ObjectId → Student
  class:          String
  section:        String
  subjects: [{
    subject:        String
    maxMarks:       Number
    obtainedMarks:  Number
    grade:          String
  }]
  totalMarks:     Number
  totalObtained:  Number
  percentage:     Number
  grade:          String
  rank:           Number
  remarks:        String
  timestamps

  Indexes:
    { schoolId, examId, studentId } UNIQUE
    { schoolId, examId, class, percentage DESC }
}
```

### 5.13 `Timetable` — Weekly Schedule

```
Timetable {
  schoolId:   ObjectId → School
  sessionId:  ObjectId → Session
  className:  String
  section:    String
  dayOfWeek:  Number  (0=Sunday … 6=Saturday)
  slots: [{
    startTime:  String  ("09:00")
    endTime:    String  ("09:45")
    subject:    String
    teacherId:  ObjectId → User
    type:       Enum [period, break, lunch, assembly]
    title:      String
  }]
  isActive:   Boolean
  timestamps

  Index: { schoolId, className, section, dayOfWeek } UNIQUE
}
```

### 5.14 `TimetableSettings` — Period/Break Config

```
TimetableSettings {
  schoolId:     ObjectId → School
  periodDuration: Number (minutes)
  workingDays:  [Number]  (e.g., [1,2,3,4,5])
  schoolStartTime: String
  schoolEndTime:   String
  breaks: [{ name, startTime, endTime }]
  timestamps
}
```

### 5.15 `TimetableVersion` — Published Timetable Snapshots

```
TimetableVersion {
  schoolId:   ObjectId → School
  sessionId:  ObjectId → Session
  versionName: String
  isPublished: Boolean
  timetableData: Mixed  ← JSON snapshot of entire timetable
  timestamps
}
```

### 5.16 `SchoolTimetableGrid` — Auto-generated Grid

```
SchoolTimetableGrid {
  schoolId:   ObjectId → School
  sessionId:  ObjectId → Session
  grid:       Mixed  ← Complete computed grid object
  generatedAt: Date
}
```

### 5.17 `Bus` — Transport

```
Bus {
  schoolId:   ObjectId → School
  busNumber:  String
  route:      String
  driverName: String
  driverPhone: String
  capacity:   Number
  isActive:   Boolean
  timestamps
}
```

### 5.18 `Notification` — SMS/Email Blast Log

```
Notification {
  schoolId:       ObjectId → School
  type:           Enum [sms, email]
  subject:        String  (email only)
  message:        String
  targetGroup:    Enum [all, defaulters, custom]
  recipientCount: Number
  sentCount:      Number
  failedCount:    Number
  status:         Enum [pending, sending, completed, failed]
  createdBy:      ObjectId → User
  timestamps

  Index: { schoolId, createdAt DESC }
}
```

### 5.19 `SystemAnnouncement` — Platform Announcements

```
SystemAnnouncement {
  title:      String
  message:    String
  isActive:   Boolean
  createdBy:  ObjectId → User
  timestamps
}
```

### 5.20 `Plan` — Subscription Plans (SaaS)

```
Plan {
  name:             String
  description:      String
  maxStudents:      Number
  maxTeachers:      Number
  priceMonthly:     Number
  priceYearly:      Number
  features:         [String]
  enabledFeatures:  [String]  ← Feature flags: ['dashboard','students','fees','ai', etc.]
  isActive:         Boolean
  stripePriceIdMonthly: String
  stripePriceIdYearly:  String
  isDefault:        Boolean
  trialDays:        Number
  timestamps
}
```

### 5.21 `SchoolSubscription` — Active Plan per School

```
SchoolSubscription {
  schoolId:     ObjectId → School
  planId:       ObjectId → Plan
  status:       String
  startDate:    Date
  endDate:      Date
  billingCycle: Enum [monthly, yearly]
  razorpaySubscriptionId: String
  timestamps
}
```

### 5.22 `SupportTicket` — Help Requests

```
SupportTicket {
  schoolId:   ObjectId → School
  userId:     ObjectId → User
  subject:    String
  message:    String
  status:     Enum [open, in_progress, resolved, closed]
  priority:   Enum [low, medium, high, critical]
  timestamps
}
```

### 5.23 `OtherPayment` — Misc Salary Payments

```
OtherPayment {
  schoolId:   ObjectId → School
  staffId:    ObjectId → User
  type:       Enum [bonus, advance, deduction]
  amount:     Number
  remarks:    String
  paymentDate: Date
  timestamps
}
```

### 5.24 `Usage` — AI Usage Tracking

```
Usage {
  schoolId:   ObjectId → School
  feature:    String  (e.g., "ai_chat")
  count:      Number
  month:      String
  timestamps
}
```

---

## 6. Service Layer

The **service layer** contains all business logic, keeping controllers thin.

| Service | Responsibility |
|---|---|
| `auth.service.ts` | register, login, logout, refreshAuth — token generation, bcrypt |
| `fee.service.ts` | Generate student fee records for the year, collect payments, overdue detection |
| `salary.service.ts` | Generate monthly salary slips, bulk pay, deduction processing |
| `student.service.ts` | Admission, search, class promotion logic |
| `school.service.ts` | School profile management |
| `ai.service.ts` | Gemini/Groq chat, context injection (school data), conversation history |
| `gmail.service.ts` | Send emails via Gmail API OAuth2 |
| `twilio.service.ts` | Send SMS via Twilio |
| `planLimit.service.ts` | Check if school has exceeded plan limits (students, teachers, features) |
| `promotion.service.ts` | Promote all students from one class to the next at year end |
| `usage.service.ts` | Increment and check AI/feature usage counts |
| `phonepe.service.ts` | PhonePe payment gateway integration |
| **PDF Services** | Generate PDF documents: |
| `pdfReceipt.service.ts` | Fee payment receipts |
| `pdfFeeStructure.service.ts` | Fee structure summary |
| `pdfReportCard.service.ts` | Exam report cards |
| `pdfAdmitCard.service.ts` | Exam admit cards |
| `pdfIdCard.service.ts` | Student ID cards |
| `pdfTimetable.service.ts` | Class timetable PDF |

---

## 7. Frontend Deep Dive

The frontend is a **Next.js 16** app using the App Router with two main route groups:

### Route Groups
- **`(auth)/`** — Public routes: login page (supports `?portal=school` or `?portal=master`)
- **`(dashboard)/`** — Protected: all management pages

### Key Pages

| Page | Path | Description |
|---|---|---|
| Landing | `/` | Marketing landing page |
| Login | `/login` | Unified login with portal selector |
| School Dashboard | `/school` | School admin home: stats, quick actions |
| Students | `/students` | Student list, search, admission form |
| Fees | `/fees` | Fee summary, collection, overdue, structure |
| Payroll | `/payroll` | Staff salary management |
| Exams | `/exams` | Exam list, result entry |
| Admit Cards | `/admit-cards` | Generate & print admit cards |
| Timetable | `/timetable` | Timetable builder, versions, PDF |
| Staff | `/staff` | Teacher/accountant management |
| Transport | `/transport` | Bus routes |
| Notifications | `/notifications` | Bulk SMS/email |
| Promotion | `/promotion` | Year-end student promotion |
| Sessions | `/sessions` | Academic year management |
| Classes | `/classes` | Class + section setup |
| Settings | `/settings` | School profile, logo, stamp |
| Plan | `/plan` | Subscription billing |
| Support | `/support` | Raise support ticket |
| **Master Dashboard** | `/master` | Super Admin: all schools, plans, users |

### State Management
- **React Context** (`context/`) — Auth state (user, tokens)
- **Store** (`store/`) — Global UI state
- **lib/** — Axios API client with interceptors for token refresh

---

## 8. Complete Feature Flows

### 8.1 Login Flow

```
1. User visits /login?portal=school
2. Enters email + password → POST /api/v1/auth/login { email, password, portal }
3. Backend:
   a. Find user by email (select +password)
   b. bcrypt.compare(password, user.password)
   c. Check portal matches role (school ↔ non-super_admin, master ↔ super_admin)
   d. Generate access token (15m) + refresh token (7d)
   e. Save refresh token to user.refreshToken in DB
   f. Return: { accessToken, refreshToken, role, redirectTo, user }
4. Frontend:
   a. Store tokens in memory/localStorage
   b. Redirect to role-based dashboard:
      - super_admin → /master/dashboard
      - others → /school/dashboard
5. All subsequent API calls → Authorization: Bearer <accessToken>
6. On 401 → frontend auto-calls POST /auth/refresh with refreshToken
7. Backend validates refreshToken, issues new pair
```

### 8.2 Student Admission Flow

```
1. School Admin → /students → "Add Student"
2. Fill form: personal info, contact, class, section, academic session
3. POST /api/v1/students
   a. multitenant() injects schoolId
   b. Controller → StudentService.createStudent()
   c. Check plan limit (planLimit.service.ts: school.studentLimit vs current count)
   d. Create Student document with unique admissionNumber per school
   e. Return student with generated ID
4. Optional: Upload photo → POST /api/v1/upload → Cloudinary
5. Optional: Assign to bus → PUT /api/v1/students/:id (usesTransport, busId)
6. Fee assignment:
   a. GET /api/v1/fees/structure/:class → fetch FeeStructure for student's class
   b. FeeService generates 12 monthly StudentFee records (one per month)
   c. Each StudentFee links to the student and the fee structure
```

### 8.3 Fee Collection Flow

```
1. Accountant → /fees → search student
2. GET /api/v1/fees/student/:studentId → returns all StudentFee records
3. Select month(s) → enter payment amount, mode, receipt number
4. POST /api/v1/fees/collect
   a. Controller → FeeService.collectFee()
   b. Find StudentFee for the month
   c. Add payment to StudentFee.payments[]
   d. Update paidAmount, remainingAmount
   e. Pre-save hook recalculates status (PENDING→PARTIAL→PAID)
   f. Update Student.paidAmount + Student.dueAmount (denormalized totals)
   g. Create FeePayment receipt record
   h. Generate PDF receipt (pdfReceipt.service.ts + PDFKit)
   i. Upload PDF to Cloudinary → store URL in FeePayment.pdfPath
5. Return receipt PDF URL → frontend opens in new tab
6. Optional: Send SMS to parent via Twilio with receipt summary
```

### 8.4 Salary Processing Flow

```
1. Admin → /payroll → select month + year → "Generate Salaries"
2. POST /api/v1/salaries/generate { month, year }
   a. FetchAll active staff for the school
   b. For each staff: fetch SalaryStructure template
   c. Create Salary record: basicSalary + allowances → totalSalary, - deductions → netSalary
   d. Status = PENDING
3. Review salary slips → "Pay All" or pay individual
4. PUT /api/v1/salaries/:id/pay { paymentMode, transactionId }
   a. Update Salary.status = PAID
   b. Set paymentDate
5. Generate salary slip PDF (pdfReceipt style) → download
6. Optional: Send SMS to staff via Twilio

Additions:
  - POST /api/v1/salary-other-payments → add bonus/advance/deduction outside monthly cycle
```

### 8.5 Exam & Result Flow

```
1. Admin → /exams → "Create Exam"
2. POST /api/v1/exams { title, type, startDate, endDate, classes[], sessionId }
   → Creates Exam document
3. Generate Admit Cards:
   GET /api/v1/exams/:id/admit-cards → pdfAdmitCard.service.ts
   → For each student in exam.classes: generate admit card page with photo, roll no.
   → Returns downloadable PDF

4. After exam → Enter Results:
   POST /api/v1/exams/:id/results (bulk)
   → for each student: { studentId, subjects[{subject, maxMarks, obtainedMarks}] }
   → Controller calculates: totalMarks, totalObtained, percentage
   → Derives grade (A+/A/B/C/D/F) from percentage
   → Assigns rank within class (sorted by percentage)
   → Creates ExamResult documents

5. Generate Report Cards:
   GET /api/v1/exams/:id/report-cards → pdfReportCard.service.ts
   → Fetches results + student info + school logo/stamp
   → Builds PDF with subject-wise table, overall grade, rank, signature area
```

### 8.6 Timetable Flow

```
1. Admin → /timetable → Configure Settings
   PUT /api/v1/timetable/settings
   → schoolStartTime, periodDuration, workingDays, breaks

2. Build Timetable per class-section-day:
   PUT /api/v1/timetable { className, section, dayOfWeek, slots[] }
   → Upsert Timetable document (unique index: school+class+section+day)
   → Each slot: { startTime, endTime, subject, teacherId, type }

3. Conflict Detection (timetable.controller.ts):
   → When assigning teacher to slot: check same teacher not already assigned 
     in same school + same day + overlapping time in any other class

4. Publish Version:
   POST /api/v1/timetable/versions
   → Snapshot current timetable grid into TimetableVersion

5. Generate PDF:
   GET /api/v1/timetable/:class/:section/pdf
   → pdfTimetable.service.ts → formatted weekly grid PDF

6. Teacher View:
   GET /api/v1/timetable/teacher → returns teacher's schedule across all classes
```

### 8.7 Subscription & Payment Flow (Razorpay)

```
1. Admin → /plan → choose plan + billing cycle
2. POST /api/v1/payments/create-order { planId, cycle }
   a. FetchPlan from DB → get price
   b. Razorpay.orders.create({ amount: price*100, currency: 'INR' })
   c. Return: { orderId, amount, currency, key }
3. Frontend opens Razorpay Checkout modal
4. On success: POST /api/v1/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   a. Verify HMAC-SHA256 signature (using razorpay_webhook_secret)
   b. Update School.subscriptionPlan + subscriptionExpiry
   c. Create/update SchoolSubscription record
5. Webhook (POST /api/v1/payments/webhook):
   a. Uses raw body (express.raw) for signature verification
   b. Handles: payment.captured, subscription.charged, subscription.cancelled
   c. Auto-renew or expire subscriptions accordingly
```

### 8.8 Notification Flow

```
1. Admin → /notifications → compose message
2. Select target: all students | fee defaulters | custom phone list
3. POST /api/v1/notifications/send { type: 'sms'|'email', message, targetGroup }
   a. Resolve recipients:
      - 'all': fetch all active students' phone/email
      - 'defaulters': fetch students where StudentFee.status = 'overdue'
      - 'custom': use provided list
   b. Create Notification record (status: 'pending')
   c. For SMS: twilio.service.ts → Twilio SMS API (loop per recipient)
   d. For Email: gmail.service.ts → Gmail API OAuth2 (loop per recipient)
   e. Increment sentCount / failedCount
   f. Update Notification.status = 'completed' | 'failed'
4. Returns notification log
```

### 8.9 AI Assistant Flow

```
1. User opens AI chat panel → sends a message
2. POST /api/v1/ai/chat { message, conversationHistory[] }
3. ai.service.ts:
   a. Fetch school context: students count, fee defaulters, upcoming exams
   b. Build system prompt with school context + role
   c. If Gemini API key configured: call Google Gemini API
   d. Fallback: call Groq API (llama-3.3-70b)
   e. Track usage → Usage model (count per school per month)
   f. Return AI response text
4. Frontend streams/displays response
5. Usage limit enforced by planLimit.service.ts based on Plan.enabledFeatures (includes 'ai')
```

---

## Appendix: Key Design Decisions

| Decision | Rationale |
|---|---|
| **Multi-tenant via schoolId** | Every record carries `schoolId` — enforced in middleware, not in each controller individually |
| **Denormalized fee totals on Student** | `Student.paidAmount` / `dueAmount` avoid aggregation on every list view |
| **Pre-save hooks for status** | `StudentFee` pre-save auto-calculates `remainingAmount` + `status` — business rules in the model |
| **No single-account Cloudinary** | Config supports up to 10 Cloudinary accounts (round-robin) to handle storage limits across a multi-school SaaS |
| **JWT Access + Refresh pair** | Short-lived access tokens (15m) reduce risk; 7-day refresh tokens stored in DB for revocation |
| **ts-node --transpile-only in dev** | Skips full type-checking at runtime to prevent OOM crashes on low-RAM machines |
| **Raw body for webhook** | Razorpay HMAC verification requires the raw request body — applied only to the webhook route before `express.json()` |
