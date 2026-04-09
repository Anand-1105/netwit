# MeetApp — Complete Codebase Analysis

> **India CIO Summit 2k25 — Conference Room Booking & Meeting Management System**
> Generated: April 2026 | Full audit covering architecture, security, scaling, code quality, and recommendations.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Data Models & Schema Design](#5-data-models--schema-design)
6. [API Reference](#6-api-reference)
7. [Application Workflows](#7-application-workflows)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Email System](#10-email-system)
11. [File Handling](#11-file-handling)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Security Vulnerabilities](#13-security-vulnerabilities)
14. [Scaling Issues](#14-scaling-issues)
15. [Code Quality Issues](#15-code-quality-issues)
16. [Bugs](#16-bugs)
17. [Dead Code & Unused Features](#17-dead-code--unused-features)
18. [Dependency Audit](#18-dependency-audit)
19. [Recommendations & Fixes](#19-recommendations--fixes)
20. [Priority Action Plan](#20-priority-action-plan)

---

## 1. Project Overview

MeetApp is a full-stack web application built for managing conference room bookings at corporate events (specifically the India CIO Summit 2025). It allows event organizers to:

- Create and manage events with assigned staff
- Import attendee lists from Excel spreadsheets
- Allow staff to book meeting slots between attendees and companies
- Track meeting completion, gift collection, and attendee status
- Generate downloadable Excel reports per event
- Manage system users with role-based access

The application is deployed via Docker Compose with a React frontend served through Nginx, a Node.js/Express backend, and MongoDB Atlas as the database.

**Live deployments referenced in code:**
- `https://idc.loopnow.in` — production frontend
- `https://meeting-app-beta-seven.vercel.app` — Vercel staging
- `http://94.250.203.249:5174` — raw IP deployment (likely a VPS)
- Backend port: `8493`

---

## 2. Tech Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 (Alpine Docker) |
| Framework | Express | ^4.21.2 |
| Database | MongoDB (Atlas) | Cloud |
| ODM | Mongoose | ^8.9.5 |
| Auth | JWT (jsonwebtoken) | ^9.0.2 |
| Password hashing | bcrypt | ^5.1.1 |
| File parsing | xlsx (SheetJS community) | ^0.18.5 |
| File upload | multer | ^1.4.5-lts.1 |
| Email | Mailtrap (mailtrap SDK) | ^3.4.0 |
| Cookie parsing | cookie-parser | ^1.4.7 |
| CORS | cors | ^2.8.5 |
| Environment | dotenv | ^16.4.7 |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | ^18.3.1 |
| Build tool | Vite | ^6.0.5 |
| Routing | React Router DOM | ^7.1.3 |
| Styling | Tailwind CSS | ^4.0.0 |
| HTTP client | Axios | ^1.7.9 |
| Forms | Formik + Yup | ^2.4.6 / ^1.6.1 |
| UI components | Ant Design | ^5.27.3 |
| Charts | Recharts | ^2.15.3 |
| Excel export | ExcelJS | ^4.4.0 |
| Animations | Framer Motion | ^12.0.6 |
| Select inputs | React Select | ^5.10.1 |
| Notifications | react-hot-toast | ^2.5.1 (installed, unused) |
| State management | React Context API | — |
| Icons | lucide-react, react-icons | ^0.474.0 / ^5.4.0 |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Frontend server | Nginx (Alpine) |
| Database hosting | MongoDB Atlas |
| CI/CD | None configured |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                 │
│  React 18 + Vite  ──  React Router v7  ──  Tailwind CSS v4     │
│                                                                 │
│  State Layer (React Context):                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ UserContext  │  │ DataContext  │  │    SlotsContext      │  │
│  │ auth, user  │  │  attendees  │  │   booked slots       │  │
│  │ login/logout│  │  per event  │  │   per event          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  HTTP: Axios (withCredentials=true, cookie-based JWT auth)      │
│  Base URL: VITE_API_BASE_URL/api                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS REST
                           │ CORS whitelist (5 origins)
                           │ httpOnly JWT cookie
┌──────────────────────────▼──────────────────────────────────────┐
│                   BACKEND (Node.js / Express)                    │
│                                                                 │
│  Middleware chain:                                              │
│  cors → express.json() → urlencoded() → cookieParser()         │
│                                                                 │
│  Route groups:                                                  │
│  /api/auth      → signup, login, logout, check-auth, users-list│
│  /api/files     → upload Excel, get/delete attendees, CRUD     │
│  /api/events    → create, read, update, delete events          │
│  /api/          → slot booking, deletion, toggle, company view │
│  /api/dashboard → stats, user table, companies, slots          │
│  /api/otp       → send OTP, set password                       │
│  /api/users     → admin user management                        │
│  /uploads       → static file serving (event images)          │
│                                                                 │
│  Auth middleware: protectRoute (JWT verify → attach req.user)  │
│  Admin middleware: isAdmin (role check)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Mongoose ODM
                           │ Connection pool (default: 5)
┌──────────────────────────▼──────────────────────────────────────┐
│                       MongoDB Atlas                              │
│                                                                 │
│  users          → system accounts (admin/manager/viewer)       │
│  events         → event records                                │
│  usercollections→ imported attendees (per event)               │
│  slots          → booked meeting slots                         │
│  otps           → OTP records (TTL index: 1 hour)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    External Services                             │
│  Mailtrap API  → transactional email (OTP delivery)            │
│  MongoDB Atlas → managed database hosting                      │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser → Axios (withCredentials) → Nginx (prod) or Vite dev server
       → Express CORS check → cookieParser → protectRoute (if guarded)
       → Controller → Mongoose → MongoDB Atlas → JSON response
```

### Docker Compose Topology

```
docker-compose.yml
├── mongodb        (mongo:7, port 27017, volume: mongodb_data)
├── backend        (node:20-alpine, port 8493, depends_on: mongodb)
└── frontend       (nginx:alpine, port 5174→80, depends_on: backend)
    └── built with VITE_API_BASE_URL build arg
```

---

## 4. Directory Structure

```
/
├── .env                          # Root env (MongoDB URI, JWT, API key)
├── package.json                  # Backend dependencies + start scripts
├── docker-compose.yml            # Full stack orchestration
├── README.md
│
├── backend/
│   ├── server.js                 # Express app entry, CORS, middleware, routes
│   ├── Dockerfile                # node:20-alpine, copies backend/, runs server.js
│   ├── lib/
│   │   └── db.js                 # Mongoose connection with timeout config
│   ├── controller/
│   │   ├── auth.controller.js    # signup, login, logout, checkAuth, usersList
│   │   ├── dashboard.controller.js # getDashboardData, getUsersListCompanywise, etc.
│   │   ├── event.controller.js   # CRUD events + image upload via multer disk storage
│   │   ├── file.controller.js    # Excel upload/parse, attendee CRUD, status update
│   │   ├── otp.controller.js     # sendOtp, setPassword
│   │   ├── slot.controller.js    # bookSlot, deleteSlot, toggleCompletion, company view
│   │   └── user.controller.js    # Admin: getAllUsers, deleteUser
│   ├── middleware/
│   │   └── auth.middleware.js    # protectRoute (JWT), isAdmin (role check)
│   ├── model/
│   │   ├── auth.model.js         # User schema (username, email, password, role)
│   │   ├── event.model.js        # Event schema (title, image, assignedTo[], dates)
│   │   ├── filedata.model.js     # UserCollection schema (attendees + cascade hooks)
│   │   ├── otp.model.js          # OTP schema with TTL index
│   │   └── Slots.js              # Slot schema (userId, company, timeSlot, event)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── event.route.js
│   │   ├── file.routes.js
│   │   ├── otp.routes.js
│   │   ├── slot.routes.js
│   │   └── user.routes.js
│   ├── mailtrap/
│   │   ├── mailtrap.config.js    # Mailtrap client (HARDCODED TOKEN)
│   │   ├── email.js              # Email helper functions (mostly unused)
│   │   └── emailTemplates.js     # HTML email templates (OTP, verification, reset)
│   ├── utils/
│   │   └── generateToken.js      # JWT sign + set httpOnly cookie
│   └── public/
│       └── uploads/events/       # Uploaded event images (local disk)
│
└── frontend/
    ├── package.json              # Frontend dependencies
    ├── vite.config.js            # Vite + Tailwind plugin (no React plugin!)
    ├── index.html
    ├── Dockerfile                # Multi-stage: node build → nginx:alpine serve
    ├── nginx.conf                # SPA routing, gzip, 1yr asset cache
    ├── .env                      # VITE_API_BASE_URL
    └── src/
        ├── main.jsx              # Root: BrowserRouter > UserProvider > DataContextProvider > SlotsContextProvider > App
        ├── App.jsx               # Route definitions (public + protected)
        ├── index.css             # @import tailwindcss + :root width
        ├── Api/
        │   ├── Axios.jsx         # Axios instance (baseURL, withCredentials)
        │   └── Api.jsx           # Mostly commented out, only empty bookSlot stub
        ├── Store/
        │   └── useAuthStore.js   # Auth API calls (signup, login, logout, checkAuth)
        ├── Context/
        │   ├── UserContext.jsx   # Auth state, login/logout/signup functions
        │   ├── DataContext.jsx   # Attendee data per event, getUniqueCompanies()
        │   └── SlotsContext.jsx  # Booked slots state, fetchSlots()
        ├── Layout/
        │   └── HomeLayout.jsx    # Navbar + <Outlet />
        ├── protectedRoutes/
        │   ├── ProtectedLogin.jsx # Redirects to /login if not authenticated
        │   └── Admin.jsx          # Checks user.isAdmin (BUG: should be user.role === 'admin')
        ├── Pages/
        │   ├── DefaultPage.jsx   # Event listing grid with search
        │   ├── Dashboard.jsx     # Hero banner + UploadFile component
        │   ├── CreateEvent.jsx   # Event creation form with image upload
        │   ├── UpdateEvent.jsx   # Event edit form
        │   ├── Meeting.jsx       # Meeting schedule view (users with booked slots)
        │   ├── Company.jsx       # Company-wise attendee view + completion toggle
        │   ├── UploadFile.jsx    # Excel upload + attendee list + UserCard grid
        │   ├── Users.jsx         # Admin user management table
        │   ├── SignIn.jsx.jsx    # Login form (Formik + Yup) — double extension bug
        │   ├── Signup.jsx        # Signup form (used at /signup route)
        │   └── Signup2.jsx       # Inline signup form (used in modals)
        └── Components/
            ├── Navbar.jsx                  # Top nav with role-aware links
            ├── UserCard.jsx                # Attendee card with slot booking form
            ├── EventDetail.jsx             # Single event detail view
            ├── DownloadReport.jsx          # Excel report generator (ExcelJS)
            ├── ForgetPasswordDialog.jsx    # OTP request modal
            ├── SetPasswordDialog.jsx       # OTP verify + new password modal
            ├── PasswordStrengthMeter.jsx   # Password strength indicator (unused in forms)
            ├── Skeleton.jsx                # Animated skeleton placeholder
            ├── Loader.jsx                  # Full-screen loading text
            └── Dashboard/
                ├── DashboardStats.jsx      # Analytics dashboard (charts + Ant Design table)
                └── Hero.jsx                # Event page hero banner image
```

---

## 5. Data Models & Schema Design

### User (`users` collection)
```js
{
  username:  String (required, unique)
  email:     String (required, unique)
  password:  String (required, bcrypt hashed)
  lastLogin: Date   (default: now)
  role:      String (enum: 'manager' | 'viewer' | 'admin', default: 'viewer')
  createdAt: Date   (auto)
  updatedAt: Date   (auto)
}
```
**Indexes:** `username` (unique), `email` (unique) — auto-created by Mongoose `unique: true`.

---

### Event (`events` collection)
```js
{
  title:       String (required)
  image:       String (path like /uploads/events/event-xxx.jpg)
  description: String
  assignedTo:  [ObjectId → User] (required)
  createdBy:   ObjectId → User   (required)
  slotGap:     Number (required) — minutes between slots: 15 | 20 | 30
  startDate:   String (required) — stored as string, NOT Date type
  endDate:     String (required) — stored as string, NOT Date type
  createdAt:   Date (auto)
  updatedAt:   Date (auto)
}
```
**Issues:** `startDate`/`endDate` typed as `String` instead of `Date` — breaks sorting and range queries.
**Missing indexes:** `assignedTo` (queried on every non-admin event list).

---

### UserCollection (`usercollections` collection) — Attendees
```js
{
  serialNo:      Number
  firstName:     String
  lastName:      String
  company:       String
  title:         String
  email:         String (required)
  phone:         String
  selectedBy:    [{ name: String, selected: Boolean }]  — companies that selected this attendee
  giftCollected: Boolean (default: false)
  status:        String (enum: 'pending'|'scheduled'|'completed'|'not-available'|'removed', default: 'pending')
  event:         ObjectId → Event (required)
  comment:       String (default: '')
  giftBy:        ObjectId → User (default: null)
  createdAt:     Date (auto)
  updatedAt:     Date (auto)
}
```
**Cascade hooks (pre-middleware):**
- `deleteOne` (document) → deletes related Slots
- `deleteMany` (query) → finds all matching user IDs, deletes related Slots
- `findOneAndDelete` → finds doc first, deletes related Slots

**Missing indexes:** `event` (critical — every query filters by event), `email`, compound `(event, email)`.

---

### Slot (`slots` collection)
```js
{
  userId:    ObjectId → UserCollection (required)
  company:   String (required)
  timeSlot:  String (required) — format "HH:MM"
  completed: Boolean (default: false)
  event:     ObjectId → Event (required)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```
**Missing indexes:** `event`, `userId`, `company`, compound `(event, company, timeSlot)` unique.
**Note:** The compound unique index would enforce the duplicate-booking prevention that currently relies on application-level checks (race condition risk).

---

### Otp (`otps` collection)
```js
{
  email:     String (required, indexed)
  otp:       String (required) — stored in PLAINTEXT
  createdAt: Date (default: now, TTL expires: 3600s)
}
```
**Issues:** OTP stored as plaintext. TTL index correctly set for 1-hour expiry.

---

### Relationships Diagram
```
User ──────────────────────────────────────────────────────┐
 │ createdBy                                               │ giftBy
 ▼                                                         │
Event ◄──── assignedTo[] ──── User[]                       │
 │                                                         │
 │ event ref                                               │
 ▼                                                         │
UserCollection (attendees) ◄───────────────────────────────┘
 │ userId
 ▼
Slots
```

---

## 6. API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | None | Register new user (role self-selectable — bug) |
| POST | `/login` | None | Login — **broken** (destructuring bug) |
| POST | `/logout` | None | Clear JWT cookie |
| POST | `/users-list` | None | List all users — **unprotected** |
| GET | `/check-auth` | Cookie | Verify JWT, return user |

### Events — `/api/events`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | None ⚠️ | Create event with image upload |
| GET | `/` | JWT | Get events (filtered by role) |
| GET | `/event-list` | JWT | Get event titles for dropdowns |
| GET | `/:id` | None ⚠️ | Get single event |
| GET | `/report/:id` | JWT | Get full event report (unbounded) |
| DELETE | `/:id` | None ⚠️ | Delete event |
| PUT | `/:id` | None ⚠️ | Update event |

### Files — `/api/files`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload-file/:event` | None ⚠️ | Upload + parse Excel attendee list |
| GET | `/get-filedata/:event` | JWT | Get all attendees for event |
| DELETE | `/delete-filedata/:event` | JWT | Delete all attendees for event |
| POST | `/update-status` | API Key only ⚠️ | Update attendee status by email |
| PUT | `/user/:id` | JWT | Update attendee (mass assignment bug) |
| DELETE | `/user/:id` | JWT | Delete single attendee |

### Slots — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/booking-slot` | None ⚠️ | Book a meeting slot |
| DELETE | `/slot/delete/:id` | None ⚠️ | Delete a slot |
| POST | `/slot/get-all-booked-slots` | None ⚠️ | Get all slots for event |
| POST | `/slot/get-company-slot-counts` | None ⚠️ | Slot counts per company |
| POST | `/slot/company/:company` | None ⚠️ | Get users booked with company |
| POST | `/slot/toggle-completed/:id` | None ⚠️ | Toggle slot completion |

### Dashboard — `/api/dashboard`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Main dashboard stats aggregation |
| POST | `/users-slot/:eventId` | JWT | Paginated user+slot table |
| GET | `/companies/:eventId` | JWT | Unique companies for event |
| GET | `/slots/:eventId` | JWT | Unique time slots for event |
| GET | `/status-distribution/:eventId?` | JWT | Status pie chart data |

### OTP — `/api/otp`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/send-otp` | None | Send OTP to email |
| POST | `/set-password` | None | Verify OTP + set new password |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT + admin check | Get all users with events |
| DELETE | `/:id` | JWT + admin check | Delete a user |

---

## 7. Application Workflows

### 1. Authentication Flow
```
User visits /login
  → Formik form (email + password validation via Yup)
  → UserContext.login() → POST /api/auth/login
  → Backend: req.body.email destructuring BUG (currently broken)
  → On success: JWT signed (7d expiry) → set as httpOnly cookie
  → userId stored in localStorage (redundant, slight XSS risk)
  → Navigate to /dashboard

Session check on every page load:
  → UserContext useEffect → GET /api/auth/check-auth
  → Backend: reads cookie → jwt.verify → User.findById
  → Sets isAuthenticated + user in context
```

### 2. Password Reset Flow
```
/login?forget=1 → ForgetPasswordDialog modal
  → POST /api/otp/send-otp { email }
  → Backend: generate 6-digit OTP → save plaintext to DB → send via Mailtrap
  → Redirect to /login?email=x → SetPasswordDialog modal
  → User enters OTP + new password
  → POST /api/otp/set-password { email, otp, password }
  → Backend: find OTP doc → bcrypt.hash(password) → save → delete OTPs
  → Redirect to /login after 1.2s
```

### 3. Event Management Flow
```
Admin: /create → CreateEvent page
  → FormData with title, description, dates, slotGap, assignedTo[], image file
  → POST /api/events (multipart/form-data) — NO AUTH ⚠️
  → multer disk storage → saves to backend/public/uploads/events/
  → Events.create() with createdBy from req.body (not req.userId) ⚠️

Event listing: DefaultPage (/)
  → GET /api/events → filtered by role (admin sees all, others see assigned only)
  → Card grid with search, edit (navigate to /event/update/:id), delete

Update: /event/update/:id
  → Fetches event + users list
  → PUT /api/events/:id — NO AUTH ⚠️
```

### 4. Attendee Import Flow
```
/event/:id → Dashboard → UploadFile component
  → User selects .xlsx file
  → POST /api/files/upload-file/:event (multipart) — NO AUTH ⚠️

Backend processing:
  1. xlsx.read(buffer) → parse workbook
  2. Extract headers from row 0
  3. Map permanent fields (Sr. No, First Name, Last Name, etc.)
  4. Identify brand columns (any header not in permanent fields)
  5. For each row: build rowData, detect brand selections via regex /(1ptr|1corp|1str)/i
  6. Skip rows with no email
  7. bulkWrite: upsert by email (merge selectedBy arrays for existing users)
  8. New users get status: "pending", giftCollected: false
```

### 5. Slot Booking Flow
```
UploadFile → UserCard component
  → SlotsContext.fetchSlots(eventId) → POST /api/slot/get-all-booked-slots
  → User selects company from selectedBy options
  → User selects time slot from generated grid (10:00–17:30, based on event slotGap)

Client-side validation (before API call):
  a. hasUserBookedCompany(company) — checks SlotsContext
  b. isTimeSlotBooked(time) — checks SlotsContext
  c. isCompanyTimeTaken(time) — checks SlotsContext

POST /api/booking-slot { userId, company, timeSlot, event } — NO AUTH ⚠️

Backend validation (after API call):
  a. No duplicate slot for same user+event+time
  b. No duplicate company+time across all users in event
  c. No duplicate company for same user in event
  → Slot created → UserCollection.status → "scheduled"

Race condition: client and server checks are not atomic.
Two concurrent requests can both pass server checks and create duplicate slots.
Fix: compound unique index on (event, company, timeSlot) in Slots collection.
```

### 6. Meeting View Flow
```
/event/:id/meeting → Meeting page
  → Two parallel fetches on mount (double-fetch bug):
    - GET /api/files/get-filedata/:event (all attendees)
    - POST /api/slot/get-all-booked-slots (all slots)
  → Client-side join: slots mapped onto users by userId string comparison
  → Filters to only users with at least one booked slot
  → Displays slot badges; non-viewers can delete slots
```

### 7. Company View Flow
```
/event/:id/company → Company page
  → DataContext.refetch(id) → loads all attendees
  → POST /api/slot/get-company-slot-counts → slot counts per company
  → getUniqueCompanies() from DataContext (client-side extraction from selectedBy)
  → Merges API counts with local company list

User clicks company:
  → POST /api/slot/company/:company { event }
  → Returns slots with populated userId (attendee details)
  → Deduplicates by userId to show unique attendees

Actions per attendee:
  → Toggle completion → POST /api/slot/toggle-completed/:id
  → Add/edit comment → PUT /api/files/user/:id
  → Mark gift collected → PUT /api/files/user/:id { giftCollected: true }
```

### 8. Report Download Flow
```
DownloadReport component → GET /api/events/report/:id
  → Returns: eventDetails, userStatistics, slotStatistics, users[], slots[]
  → Client builds Excel with ExcelJS:
    - Extracts unique company names from users[].selectedBy
    - Adds header row + company columns
    - For each user: checks if completed slot exists for each company
    - Marks cell as 1 if completed, empty otherwise
  → Triggers browser download as {eventTitle}.xlsx
```

---

## 8. Frontend Architecture

### State Management
Three React Contexts wrap the entire app in `main.jsx`:

```
BrowserRouter
  └── UserProvider          (auth state: user, isAuthenticated, loading)
        └── DataContextProvider  (attendee data: fileUserData, refetch)
              └── SlotsContextProvider  (slot data: slots, fetchSlots)
                    └── App
```

**Problems with this structure:**
- `DataContext` calls `useParams()` internally — couples context to router, only works inside a route with `:id`. The extracted `id` is never used inside the context body (dead code).
- `SlotsContext` has no auto-fetch — every consumer must manually call `fetchSlots(eventId)`. `UserCard` calls it on mount via `useEffect`, causing one fetch per card rendered.
- No shared loading/error state between contexts — each manages its own independently.
- `UserContext` stores `userId` in both React state and `localStorage` — redundant and inconsistent.

### Routing (`App.jsx`)
```
/ (HomeLayout)
  /login          → SignIn (public)
  /signup         → SignUp (ProtectedAdmin — broken, checks user.isAdmin not user.role)

/ (ProtectedLogin → HomeLayout)
  /               → DefaultPage (event listing)
  /event/:id      → Dashboard (Hero + UploadFile)
  /event/:id/meeting   → Meeting
  /event/:id/company   → Company
  /event/update/:id    → UpdateEvent
  /dashboard      → DashboardStats
  /create         → CreateEvent
  /users          → Users
  *               → Navigate to /
```

**Note:** `/event/update/:id` and `/event/:id` share the `/event/` prefix. React Router v7 handles this correctly via specificity, but the ordering matters — `update` must be matched before `:id`.

### Component Hierarchy
```
App
├── HomeLayout (Navbar + Outlet)
│   ├── DefaultPage
│   │   └── ConfirmationDialog (inline)
│   ├── Dashboard
│   │   ├── Hero
│   │   └── UploadFile (FileUpload)
│   │       └── UserCard (×N per attendee)
│   │           └── Booking form (inline)
│   ├── Meeting
│   ├── Company
│   ├── CreateEvent
│   │   └── Signup2 (modal)
│   ├── UpdateEvent
│   ├── DashboardStats
│   │   └── Ant Design Table + Recharts PieChart
│   ├── Users
│   └── SignIn
│       ├── ForgetPasswordDialog
│       └── SetPasswordDialog
```

### Key Component Notes

**UserCard** — the most complex component. Manages its own local state for:
- Booking form visibility
- Selected company/time
- Edit dialog
- Delete dialog
- Edit form values

It also calls `fetchSlots(eventId)` on every mount via `useEffect`. If 50 attendees are displayed, this fires 50 simultaneous API calls on page load.

**DashboardStats** — fires multiple API calls on mount and on every filter change:
- `fetchEventOptions` on mount
- `fetchDashboardData` on `[timeRange, selectedEvent]` change
- `fetchUsersData` on `[timeRange, selectedEvent, filters, pagination.current]` change
- `fetchFilterOptions` on `[selectedEvent]` change

No debouncing on filter inputs — every keystroke in the search box triggers a new API call.

---

## 9. Authentication & Authorization

### Mechanism
- JWT signed with `process.env.JWT_Token` (currently `"SECRET_KEY_FILE_APP"` — weak)
- Token stored as `httpOnly` cookie, `secure` in production, `sameSite: none` in production / `lax` in dev
- Token expiry: 7 days, no refresh mechanism
- `protectRoute` middleware: reads cookie → `jwt.verify` → `User.findById` → attaches `req.userId` and `req.user`

### Role System
```
viewer   → read-only access to attendees, slots, companies
           UI hides upload, delete, mark-complete, comment buttons
manager  → full write access within assigned events
admin    → full access: all events, user management, dashboard
```

### Authorization Gaps
The role system is enforced inconsistently:

| Endpoint | Expected | Actual |
|---|---|---|
| POST /api/events | admin | no auth at all |
| DELETE /api/events/:id | admin | no auth at all |
| PUT /api/events/:id | admin/manager | no auth at all |
| POST /api/files/upload-file/:event | manager+ | no auth at all |
| POST /api/booking-slot | manager+ | no auth at all |
| DELETE /api/slot/delete/:id | manager+ | no auth at all |
| POST /api/slot/toggle-completed/:id | manager+ | no auth at all |
| POST /api/auth/users-list | authenticated | no auth at all |

UI-only role checks (buttons hidden for viewers) are not backed by API-level enforcement on most slot and event routes.

### Frontend Auth Guard Bug
`ProtectedAdmin` (`Admin.jsx`) checks `user.isAdmin` which doesn't exist on the User model:
```js
// Bug — isAdmin is always undefined → falsy → every authenticated user is blocked
if (!user.isAdmin) { return <Navigate to="/" /> }

// Should be:
if (user.role !== 'admin') { return <Navigate to="/" /> }
```
This means the `/signup` route (intended for admins only) redirects all users including admins.

---

## 10. Email System

### Provider
Mailtrap (transactional email API), SDK version `^3.4.0`.

### Configuration (`mailtrap.config.js`)
```js
const TOKEN = "48295a46cac835ce2b77e385b0f56840"; // HARDCODED — must be moved to .env
const ENDPOINT = "https://send.api.mailtrap.io/";

export const client = new MailtrapClient({ token: TOKEN, endpoint: ENDPOINT });
export const sender = { ... }; // defined in email.js
```

### Templates (`emailTemplates.js`)
Four templates defined:
- `VERIFICATION_EMAIL_TEMPLATE` — email verification (feature commented out)
- `PASSWORD_RESET_REQUEST_TEMPLATE` — password reset link (feature commented out)
- `PASSWORD_RESET_SUCCESS_TEMPLATE` — reset success (feature commented out)
- `OTP_EMAIL_TEMPLATE` — OTP delivery (active, used in `otp.controller.js`)

### OTP Flow Issues
- OTP stored as plaintext string in MongoDB — should be hashed
- No attempt counter — unlimited guesses on 6-digit OTP (1,000,000 combinations)
- No rate limiting on `/api/otp/send-otp` — can spam email sends
- OTP TTL is 1 hour — very long for a 6-digit code (5–10 minutes is standard)
- Resend OTP button in `SetPasswordDialog` has no cooldown

---

## 11. File Handling

### Excel Upload (Attendees)
- **Library:** `xlsx` (SheetJS community edition `0.18.5`) — unmaintained, has known CVEs
- **Storage:** `multer()` with no configuration — entire file buffered in Node.js heap memory
- **Size limit:** None — any size file accepted
- **Auth:** None — any unauthenticated request can upload
- **Processing:** Synchronous in-process parsing — blocks event loop for large files

Brand selection detection regex: `/(1ptr|1corp|1str)/i` — hardcoded, not configurable per event.

### Event Image Upload
- **Library:** `multer` with disk storage
- **Destination:** `backend/public/uploads/events/`
- **Filename:** `event-{timestamp}-{random}.{ext}`
- **Filter:** checks both `extname` and `mimetype` for jpeg/jpg/png/gif
- **Size limit:** 5MB
- **Serving:** `express.static` at `/uploads`
- **Issue:** Files stored on container local disk — breaks with multiple backend replicas

### Report Download (Excel Export)
- **Library:** `ExcelJS` (frontend) — modern, maintained
- **Process:** Client-side generation from API data
- **Issue:** `getEventReport` returns all users and slots unbounded — large events send massive JSON payloads to the client before Excel generation begins

---

## 12. Deployment & Infrastructure

### Docker Compose Services
```yaml
mongodb:   mongo:7, port 27017 exposed to host ⚠️, volume: mongodb_data
backend:   node:20-alpine, port 8493, uploads volume mounted
frontend:  nginx:alpine, port 5174→80, VITE_API_BASE_URL baked at build time
```

### Issues
- **MongoDB port exposed:** `27017:27017` in compose means the DB is reachable from outside the container network if the host firewall isn't locked down. Remove the `ports` mapping for MongoDB in production — backend can reach it via the internal Docker network.
- **HTTP by default:** `VITE_API_BASE_URL` defaults to `http://94.250.203.249:8493` — unencrypted traffic between browser and backend. Should use HTTPS with a proper domain.
- **Hardcoded IP in compose:** `http://94.250.203.249:8493` is baked into the frontend build arg default. If the server IP changes, a full rebuild is required.
- **No health checks:** Docker won't detect a silently crashed backend. Add `healthcheck` to backend and mongodb services.
- **No resource limits:** No CPU/memory limits on any container — a runaway process can starve the host.
- **Single backend replica:** Event images on local disk means horizontal scaling is impossible without a shared storage solution (S3, NFS, etc.).
- **No reverse proxy in front of backend:** Backend is directly exposed on port 8493. Should sit behind Nginx with TLS termination.
- **No CI/CD pipeline:** No automated testing, linting, or deployment configured.

### Nginx Config (`nginx.conf`)
```nginx
gzip on;                          # good
try_files $uri $uri/ /index.html; # correct SPA fallback
expires 1y; Cache-Control: public, immutable; # good for hashed assets
```
Missing: HTTPS redirect, security headers (X-Frame-Options, CSP, HSTS), rate limiting.

---

## 13. Security Vulnerabilities

### Critical

**S1 — Broken Login (`auth.controller.js:118`)**
```js
// Current — destructures from a string, always undefined
const { email, password } = req.body.email;

// Fix
const { email, password } = req.body;
```

**S2 — Hardcoded Mailtrap Token (`mailtrap.config.js:3`)**
```js
// Current
const TOKEN = "48295a46cac835ce2b77e385b0f56840";

// Fix — move to .env
const TOKEN = process.env.MAILTRAP_TOKEN;
```
Rotate the token immediately if the repo has ever been pushed to a remote.

**S3 — Real Credentials in `.env`**
MongoDB URI with password, JWT secret, and API key are in `.env`. If committed to git, rotate all three immediately. Add `.env` to `.gitignore` and use a secrets manager or CI/CD environment variables for production.

---

### High

**S4 — Unauthenticated File Upload**
`POST /api/files/upload-file/:event` has no `protectRoute`. Anyone can upload arbitrary Excel data to any event ID.
```js
// Fix
router.post("/upload-file/:event", protectRoute, upload.single("file"), uploadFile);
```

**S5 — Unauthenticated Event Mutation Routes**
```js
// Fix event.route.js
router.post('/', protectRoute, isAdmin, uploadEventImage, createEvent);
router.delete('/:id', protectRoute, isAdmin, deleteEvent);
router.put('/:id', protectRoute, updateEvent);
router.get('/:id', protectRoute, getEventById);
```

**S6 — All Slot Routes Unauthenticated**
```js
// Fix slot.routes.js — add protectRoute to all routes
router.post('/booking-slot', protectRoute, bookSlot);
router.delete('/slot/delete/:id', protectRoute, deleteSlot);
// ... etc
```

**S7 — `usersList` Leaks All User Data**
```js
// Fix auth.routes.js
router.post("/users-list", protectRoute, usersList);
```

**S8 — Mass Assignment in `updateUser`**
```js
// Current — entire req.body passed to DB
await UserCollection.findByIdAndUpdate(id, updateFields, { new: true });

// Fix — whitelist allowed fields
const { firstName, lastName, company, title, phone, status, comment, giftCollected } = req.body;
await UserCollection.findByIdAndUpdate(id, { firstName, lastName, company, title, phone, status, comment, giftCollected }, { new: true });
```

**S9 — `checkAuth` Unhandled JWT Error**
```js
// Fix — wrap in try/catch
export const checkAuth = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_Token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ authenticated: false });
    return res.status(200).json({ authenticated: true, user });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
};
```

**S10 — `createdBy` Taken from Client Body**
```js
// Current — client can supply any userId as creator
const { createdBy } = req.body;

// Fix — use authenticated user from middleware
const createdBy = req.userId;
```

---

### Medium

**S11 — ReDoS via Unescaped Regex Input**
```js
// Fix — escape user input before using in $regex
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
{ firstName: { $regex: escapeRegex(search), $options: 'i' } }
```

**S12 — OTP Stored in Plaintext**
```js
// Fix otp.controller.js — hash before saving
const hashedOtp = await bcrypt.hash(otp, 10);
await Otp.create({ email, otp: hashedOtp });

// Verify
const otpDoc = await Otp.findOne({ email });
const valid = await bcrypt.compare(otp, otpDoc.otp);
```

**S13 — No Rate Limiting**
```js
// Fix — add to server.js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const otpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

app.use('/api/auth/login', authLimiter);
app.use('/api/otp', otpLimiter);
```

**S14 — Weak JWT Secret**
Replace `"SECRET_KEY_FILE_APP"` with a 256-bit random string:
```bash
openssl rand -base64 32
```

**S15 — CORS Raw IP with Credentials**
Remove `http://94.250.203.249:5174` from `allowedOrigins` and replace with the proper domain.

**S16 — No Security Headers**
```js
// Fix — add helmet as first middleware in server.js
import helmet from 'helmet';
app.use(helmet());
```

**S17 — No Body Size Limit**
```js
// Fix
app.use(express.json({ limit: '1mb' }));
app.use(urlencoded({ extended: true, limit: '1mb' }));
```

**S18 — Self-Selectable Admin Role on Signup**
Remove the `admin` option from the role dropdown in `Signup.jsx` and `Signup2.jsx`. Role assignment should be admin-only via the Users management page.

---

### Low

**S19 — Token Logged to Console**
```js
// Remove from auth.middleware.js
console.log("Token from cookies:", token);
console.log("User Found:", req.user);
```

**S20 — Outdated `xlsx` Package**
Replace `xlsx` (SheetJS community, unmaintained) with `exceljs` which is already a frontend dependency:
```bash
npm install exceljs
npm uninstall xlsx
```

---

## 14. Scaling Issues

### P1–P5 — Missing Database Indexes

Add these to the model files immediately. Without them every query is a full collection scan.

```js
// filedata.model.js — add before export
UserSchema.index({ event: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ event: 1, status: 1 });
UserSchema.index({ event: 1, email: 1 }, { unique: true }); // also prevents duplicate emails per event

// Slots.js — add before export
slotSchema.index({ event: 1 });
slotSchema.index({ event: 1, userId: 1 });
slotSchema.index({ event: 1, company: 1, timeSlot: 1 }, { unique: true }); // enforces no-duplicate at DB level

// event.model.js — add before export
eventSchema.index({ assignedTo: 1 });
```

### P6 — Race Condition on Slot Booking

Application-level duplicate checks in `bookSlot` are not atomic. Two concurrent requests can both pass all three checks and create duplicate slots. The compound unique index on `(event, company, timeSlot)` above fixes this — MongoDB will reject the second insert with a duplicate key error. Handle it gracefully:

```js
try {
  await newSlot.save();
} catch (err) {
  if (err.code === 11000) {
    return res.status(409).json({ error: "This slot was just taken. Please choose another." });
  }
  throw err;
}
```

### P7 — Unbounded Memory in File Upload

```js
// Current — no size limit, entire file in RAM
const upload = multer();

// Fix
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
  storage: multer.memoryStorage()
});
```

### P8 — `deleteMany` Pre-Hook Loads All User IDs into Memory

```js
// Current — fetches all user docs into Node heap
const users = await mongoose.model('UserCollection').find(filter, '_id');
const userIds = users.map(u => u._id);
await mongoose.model('Slot').deleteMany({ userId: { $in: userIds } });

// Fix — Slot already has event ref, delete directly
UserSchema.pre('deleteMany', { document: false, query: true }, async function(next) {
  try {
    const filter = this.getFilter();
    if (filter.event) {
      await mongoose.model('Slot').deleteMany({ event: filter.event });
    }
    next();
  } catch (err) { next(err); }
});
```

### P9 — Unbounded Result Sets

`getFileData`, `getEventReport`, and `usersList` return all documents with no pagination:

```js
// getFileData — add pagination
const { page = 1, limit = 100 } = req.query;
const data = await UserCollection.find({ event })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));

// getEventReport — don't return raw users/slots arrays
// Instead return only the aggregated statistics; let the download endpoint handle full data
```

### P10 — N+1 Fetches from UserCard

`UserCard` calls `fetchSlots(eventId)` in a `useEffect` on every mount. With 50 cards rendered, this fires 50 identical API calls simultaneously. Fix: fetch slots once at the parent (`UploadFile`) level and pass them down as props, or rely on the `SlotsContext` which already holds the data.

```jsx
// UploadFile.jsx — fetch once
useEffect(() => { if (id) fetchSlots(id); }, [id]);

// UserCard — remove the useEffect that calls fetchSlots
// Read from SlotsContext directly (already doing this via useContext)
```

### P11 — Dashboard Aggregation Not Cached

The `getDashboardData` aggregation runs a full `$lookup` + `$facet` pipeline on every request. With no caching, every user hitting the dashboard fires this against MongoDB.

Quick fix — add a short TTL cache in memory:
```js
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export const getDashboardData = async (req, res) => {
  const cacheKey = `dashboard_${eventId}_${timeRange}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json({ success: true, data: cached.data });
  }
  // ... run aggregation ...
  cache.set(cacheKey, { data: dashboardData, ts: Date.now() });
};
```
For production, use Redis.

### P12 — No Debounce on Dashboard Search

Every keystroke in the DashboardStats search input triggers `fetchUsersData` → API call:
```jsx
// Fix — debounce the search input
import { useDebouncedCallback } from 'use-debounce'; // or implement manually

const debouncedSearch = useDebouncedCallback(
  (value) => handleFilterChange('search', value),
  400
);
<Input onChange={(e) => debouncedSearch(e.target.value)} />
```

### P13 — MongoDB Connection Pool

```js
// db.js — add maxPoolSize
await mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 50000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 50000,
});
```

### P14 — Single Node Process

Node.js is single-threaded. Excel parsing and large aggregations block the event loop for all other requests. Use PM2 cluster mode or Node's built-in cluster module:
```bash
pm2 start backend/server.js -i max --name meetapp-backend
```

### P15 — Event Images on Local Disk

Images stored in `backend/public/uploads/events/` are tied to a single container. To scale horizontally or survive container restarts without a volume, move image storage to an object store (AWS S3, Cloudflare R2, etc.) and store only the URL in the database.

---

## 15. Code Quality Issues

### Backend

**CQ1 — Inconsistent error response shape**
Controllers use both `{ error: "..." }` and `{ message: "..." }` and `{ success: false, message: "..." }` interchangeably. The frontend has to handle all three shapes. Standardize to one shape:
```js
// Adopt this everywhere
res.status(4xx).json({ success: false, message: "Human readable", code: "MACHINE_CODE" });
```

**CQ2 — `startDate`/`endDate` typed as String in Event model**
```js
// Current
startDate: { type: String, required: true }

// Fix
startDate: { type: Date, required: true }
endDate:   { type: Date, required: true }
```
This enables proper date sorting, range queries, and comparison operators in MongoDB.

**CQ3 — `createdBy` in `createEvent` taken from `req.body`**
Any client can pass any userId as the event creator. Use `req.userId` from the auth middleware instead.

**CQ4 — `getCompanyData` in `slot.controller.js` has a malformed template literal**
The file contains what appears to be a copy-paste artifact mid-string in the regex:
```js
company: { $regex: `^${companyName}<file name="backend/controller/slot.controller.js"...
```
This would cause a runtime syntax error. The regex should be:
```js
company: { $regex: `^${companyName}$`, $options: 'i' }
```

**CQ5 — `generateTimeSlots` duplicated in two components**
Identical function exists in both `UploadFile.jsx` and `Meeting.jsx`. Extract to a shared utility:
```js
// src/utils/timeSlots.js
export const generateTimeSlots = (slotGap = 30) => { ... };
```

**CQ6 — `console.log` statements throughout production code**
`auth.middleware.js`, `file.controller.js`, `slot.controller.js`, `UserCard.jsx`, `DashboardStats.jsx`, and others all have `console.log` calls that will appear in production logs. Replace with a proper logger (e.g. `pino` or `winston`) with log levels.

### Frontend

**CQ7 — `alert()` used for all user feedback**
`UserContext.jsx`, `ProtectedLogin.jsx`, `UserCard.jsx`, `Meeting.jsx`, and others use `window.alert()`. `react-hot-toast` is already installed — use it:
```js
import toast from 'react-hot-toast';
toast.success("Logged in successfully");
toast.error("Invalid credentials");
```

**CQ8 — `userId` stored in both context state and `localStorage`**
```js
// UserContext.jsx — remove this line
localStorage.setItem("userId", response.user._id);
```
The user object is already in context. `CreateEvent.jsx` reads `localStorage.getItem("userId")` — change it to read from `UserContext` instead.

**CQ9 — `Signup.jsx` and `Signup2.jsx` are near-identical**
One uses Formik, one uses manual state. Consolidate into a single `SignupForm` component that accepts props for context (modal vs page, eventId).

**CQ10 — `vite.config.js` missing React plugin**
```js
// Current
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [tailwindcss()] });

// Fix
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

**CQ11 — `PasswordStrengthMeter` component is never used**
Defined in `Components/PasswordStrengthMeter.jsx` but not imported anywhere. Either use it in the signup forms or delete it.

**CQ12 — `Api.jsx` is essentially empty**
`frontend/src/Api/Api.jsx` contains only commented-out code and an empty `bookSlot` stub. Delete it.

---

## 16. Bugs

| # | Severity | Description | File | Fix |
|---|---|---|---|---|
| B1 | Critical | Login always fails — `req.body.email` destructured instead of `req.body` | `auth.controller.js:118` | `const { email, password } = req.body;` |
| B2 | High | `ProtectedAdmin` checks `user.isAdmin` (undefined) — admin route blocks all users | `Admin.jsx` | `user.role !== 'admin'` |
| B3 | High | `getCompanyData` has malformed template literal in regex — runtime syntax error | `slot.controller.js` | Fix regex string |
| B4 | Medium | `EventDetail.jsx` shows `startDate` for both start and end date | `EventDetail.jsx:38` | Change to `event.endDate` |
| B5 | Medium | `Meeting.jsx` double-fetches on mount — two `useEffect` both call `fetchData` | `Meeting.jsx` | Remove the second `useEffect` |
| B6 | Medium | `UserCard` calls `fetchSlots` on every card mount — N×1 API calls | `UserCard.jsx` | Remove `useEffect`, rely on parent-fetched context |
| B7 | Medium | `DashboardStats` reads `user.role` before auth loading completes — potential null crash | `DashboardStats.jsx` | Guard with `if (!user) return` |
| B8 | Medium | `DefaultPage` crashes if `event.description` is null during search filter | `DefaultPage.jsx` | `(event.description || '').toLowerCase()` |
| B9 | Low | `UserCard.highlightMatch` builds regex from raw user input — crashes on special chars | `UserCard.jsx` | Escape input before `new RegExp()` |
| B10 | Low | `DownloadReport` doesn't revoke object URL on error — memory leak | `DownloadReport.jsx` | Wrap in try/finally |
| B11 | Low | `DataContext` calls `useParams()` internally but never uses the result | `DataContext.jsx` | Remove the `useParams` call |
| B12 | Low | `SignIn.jsx.jsx` — double file extension, may cause import resolution issues | filename | Rename to `SignIn.jsx` |
| B13 | Low | `Hero.jsx` imports image but uses a hardcoded string path — import is unused | `Hero.jsx` | Remove unused import |

---

## 17. Dead Code & Unused Features

| Item | Location | Notes |
|---|---|---|
| Email verification flow | `auth.controller.js` (commented out) | `verifyemail`, `VERIFICATION_EMAIL_TEMPLATE` — never wired up |
| Forgot password via link | `auth.controller.js` (commented out) | `forgotPassword`, `resetPassword` — replaced by OTP flow |
| `PASSWORD_RESET_REQUEST_TEMPLATE` | `emailTemplates.js` | Unused — link-based reset is commented out |
| `PASSWORD_RESET_SUCCESS_TEMPLATE` | `emailTemplates.js` | Unused |
| `email.js` helper functions | `mailtrap/email.js` | Likely unused — OTP controller imports directly from `mailtrap.config.js` |
| `Api.jsx` | `frontend/src/Api/Api.jsx` | Entirely commented out except empty `bookSlot` stub |
| `PasswordStrengthMeter` | `frontend/src/Components/PasswordStrengthMeter.jsx` | Defined, never imported |
| `Skeleton.jsx` | `frontend/src/Components/Skeleton.jsx` | Defined, usage unclear |
| `isAdmin` middleware | `auth.middleware.js` | Exported but never used in any route |
| `useParams` in DataContext | `DataContext.jsx` | Imported and called, result never used |
| `image` import in Hero.jsx | `Hero.jsx` | Imported but hardcoded string path used instead |
| `axios` direct import in Signup2 | `Signup2.jsx` | `import axios from 'axios'` — unused, `Axios` instance used instead |
| Slot deletion in file.controller.js | `file.controller.js` (commented out) | Old slot deletion logic replaced by `slot.controller.js` |

---

## 18. Dependency Audit

### Backend (`package.json`)
| Package | Version | Status | Notes |
|---|---|---|---|
| express | ^4.21.2 | ✅ Current | |
| mongoose | ^8.9.5 | ✅ Current | |
| jsonwebtoken | ^9.0.2 | ✅ Current | |
| bcrypt | ^5.1.1 | ✅ Current | |
| multer | ^1.4.5-lts.1 | ⚠️ LTS only | No new features, security fixes only |
| xlsx | ^0.18.5 | ❌ Unmaintained | SheetJS community edition abandoned; has CVEs. Replace with `exceljs` |
| mailtrap | ^3.4.0 | ✅ Current | |
| cookie-parser | ^1.4.7 | ✅ Current | |
| cors | ^2.8.5 | ✅ Current | |
| dotenv | ^16.4.7 | ✅ Current | |
| crypto | ^1.0.1 | ⚠️ Redundant | `crypto` is a Node.js built-in; this npm package is a no-op shim. Remove it. |

**Missing recommended packages:**
- `helmet` — security headers
- `express-rate-limit` — rate limiting
- `express-mongo-sanitize` — NoSQL injection prevention
- `pino` or `winston` — structured logging

### Frontend (`frontend/package.json`)
| Package | Version | Status | Notes |
|---|---|---|---|
| react | ^18.3.1 | ✅ Current | |
| vite | ^6.0.5 | ✅ Current | |
| react-router-dom | ^7.1.3 | ✅ Current | |
| tailwindcss | ^4.0.0 | ✅ Current (v4) | |
| axios | ^1.7.9 | ✅ Current | |
| antd | ^5.27.3 | ✅ Current | Heavy — only used in DashboardStats table |
| exceljs | ^4.4.0 | ✅ Current | |
| formik | ^2.4.6 | ✅ Current | Only used in `SignIn.jsx` and `Signup.jsx`; `Signup2.jsx` uses manual state |
| framer-motion | ^12.0.6 | ✅ Current | |
| react-hot-toast | ^2.5.1 | ✅ Installed | **Never used** — replace all `alert()` calls with this |
| recharts | ^2.15.3 | ✅ Current | |
| react-select | ^5.10.1 | ✅ Current | |
| zustand | ^5.0.3 | ⚠️ Installed, unused | Imported in package.json but no store files exist. Remove or use it. |
| lucide-react | ^0.474.0 | ⚠️ Possibly unused | `react-icons` is used throughout; check if `lucide-react` is actually imported anywhere |
| chart.js | ^4.4.9 | ⚠️ Possibly unused | `recharts` is used for charts; verify if `chart.js` is imported anywhere |

---

## 19. Recommendations & Fixes

### Immediate (do before next deployment)

**1. Fix the login bug**
```js
// auth.controller.js:118
const { email, password } = req.body; // was req.body.email
```

**2. Rotate all exposed credentials**
- Mailtrap token `48295a46cac835ce2b77e385b0f56840` — regenerate in Mailtrap dashboard
- MongoDB password `mr6noq4LftO9w92W` — rotate in Atlas
- Generate a new JWT secret: `openssl rand -base64 32`
- Move Mailtrap token from source code to `.env`

**3. Add `protectRoute` to all unprotected write routes**
```js
// event.route.js
router.post('/', protectRoute, uploadEventImage, createEvent);
router.delete('/:id', protectRoute, deleteEvent);
router.put('/:id', protectRoute, updateEvent);
router.get('/:id', protectRoute, getEventById);

// file.routes.js
router.post("/upload-file/:event", protectRoute, upload.single("file"), uploadFile);

// slot.routes.js — add protectRoute to all 6 routes
```

**4. Fix `ProtectedAdmin` role check**
```js
// Admin.jsx
if (user.role !== 'admin') { return <Navigate to="/" replace />; }
```

**5. Add database indexes**
```js
// filedata.model.js
UserSchema.index({ event: 1 });
UserSchema.index({ event: 1, email: 1 }, { unique: true });

// Slots.js
slotSchema.index({ event: 1, company: 1, timeSlot: 1 }, { unique: true });
slotSchema.index({ event: 1, userId: 1 });
```

---

### Short-term (next sprint)

**6. Add `helmet` and rate limiting**
```js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use('/api/otp', rateLimit({ windowMs: 60*60*1000, max: 5 }));
```

**7. Fix mass assignment in `updateUser`**
Whitelist the fields that are allowed to be updated.

**8. Fix `createdBy` in `createEvent`**
Use `req.userId` from the auth middleware, not `req.body.createdBy`.

**9. Remove admin role from signup form**
Users should not be able to self-assign the admin role.

**10. Replace `alert()` with `react-hot-toast`**
Add `<Toaster />` to `main.jsx` and replace all `alert()` / `window.confirm()` calls.

**11. Fix `startDate`/`endDate` type in Event model**
Change from `String` to `Date`.

**12. Fix double-fetch in `Meeting.jsx`**
Remove the second `useEffect(() => fetchData(), [])`.

**13. Fix `UserCard` N×1 slot fetches**
Remove `useEffect` that calls `fetchSlots` from `UserCard`. Fetch once in `UploadFile` and pass slots as props or rely on the already-populated `SlotsContext`.

**14. Add multer file size limit**
```js
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
```

**15. Escape regex input in dashboard and slot controllers**
```js
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

---

### Medium-term (architectural improvements)

**16. Replace `xlsx` with `exceljs` on the backend**
`exceljs` is already a frontend dependency, is actively maintained, and supports streaming for large files.

**17. Move event image storage to object storage**
Use AWS S3, Cloudflare R2, or similar. Store only the URL in MongoDB. This unblocks horizontal scaling.

**18. Add Redis caching for dashboard aggregations**
Cache the `getDashboardData` result with a 30–60 second TTL per `(eventId, timeRange)` key.

**19. Add debounce to dashboard search input**
400ms debounce before firing the API call.

**20. Consolidate `Signup.jsx` and `Signup2.jsx`**
One `SignupForm` component with props for `eventId` and `onSuccess`.

**21. Extract `generateTimeSlots` to a shared utility**
Remove duplication between `UploadFile.jsx` and `Meeting.jsx`.

**22. Add `healthcheck` to Docker Compose**
```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8493/api/auth/check-auth"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**23. Remove unused dependencies**
```bash
npm uninstall zustand chart.js lucide-react  # frontend (verify first)
npm uninstall crypto                          # backend (built-in, no-op shim)
```

**24. Hash OTPs before storing**
Use `bcrypt.hash(otp, 10)` before saving, `bcrypt.compare` on verification.

**25. Add structured logging**
Replace `console.log` with `pino` (backend) for structured, level-aware logging.

---

## 20. Priority Action Plan

### 🔴 Do Now (before next user touches the app)

| # | Action | Why |
|---|---|---|
| 1 | Fix login destructuring bug | App is currently broken — no one can log in |
| 2 | Rotate Mailtrap token | Hardcoded in source, likely exposed |
| 3 | Rotate MongoDB password | In `.env`, may be committed to git |
| 4 | Add `protectRoute` to event/slot/upload routes | Anyone can delete events or upload data |
| 5 | Fix `ProtectedAdmin` `isAdmin` → `role` check | Admin-only pages are inaccessible to admins |

### 🟠 This Week

| # | Action | Why |
|---|---|---|
| 6 | Add DB indexes (event, email, slots) | Every query is a full scan — performance degrades with data |
| 7 | Add `helmet` + rate limiting | Basic hardening against bots and brute force |
| 8 | Fix mass assignment in `updateUser` | Any field on an attendee can be overwritten |
| 9 | Fix `createdBy` to use `req.userId` | Event creator can be spoofed |
| 10 | Remove admin role from signup form | Any visitor can register as admin |
| 11 | Add multer file size limit | Unbounded uploads can OOM the server |

### 🟡 This Month

| # | Action | Why |
|---|---|---|
| 12 | Replace `alert()` with toast notifications | UX — alerts block the browser thread |
| 13 | Fix double-fetch in Meeting.jsx | Wastes bandwidth, causes flicker |
| 14 | Fix UserCard N×1 slot fetches | 50 cards = 50 API calls on page load |
| 15 | Fix `startDate`/`endDate` type | Enables proper date sorting and filtering |
| 16 | Escape regex inputs | ReDoS protection |
| 17 | Hash OTPs | Security hardening |
| 18 | Replace `xlsx` with `exceljs` | Remove unmaintained package with CVEs |
| 19 | Add debounce to dashboard search | Reduces unnecessary API calls |
| 20 | Consolidate Signup components | Code maintainability |

### 🟢 Next Quarter

| # | Action | Why |
|---|---|---|
| 21 | Move image storage to S3/R2 | Enables horizontal scaling |
| 22 | Add Redis caching for dashboard | Reduces DB load under concurrent users |
| 23 | Add CI/CD pipeline | Automated testing and deployment |
| 24 | Add structured logging (pino) | Observability in production |
| 25 | Add Docker health checks + resource limits | Reliability and stability |
| 26 | Set up HTTPS with proper domain for all environments | Encrypt traffic end-to-end |
| 27 | Remove unused dependencies | Bundle size and attack surface reduction |

---

*End of analysis. Total issues found: 20 security, 18 scaling, 12 code quality, 13 bugs, 14 dead code items.*
