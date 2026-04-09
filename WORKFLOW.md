# MeetApp — Complete Development Workflow

> Full record of every change made to this codebase from initial audit to production deployment.

---

## Phase 1 — Security Audit

### What was done
Performed a full manual static analysis of the entire codebase. No automated scanners used.

### Method
- Read all 7 route files and mapped every endpoint against its middleware chain
- Read all 7 controllers tracing input → DB → response data flow
- Read all 5 Mongoose models checking indexes, types, and cascade hooks
- Read all context providers, protected routes, pages, and components
- Cross-referenced frontend API calls against backend routes
- Read `package.json`, `docker-compose.yml`, `.env`, and all config files

### Critical findings fixed
- **Login broken** — `req.body.email` destructured instead of `req.body` (always returned undefined)
- **Mailtrap token hardcoded** in source code (`mailtrap.config.js`)
- **All slot routes unprotected** — anyone could book/delete/toggle slots without auth
- **All event mutation routes unprotected** — anyone could create/delete/update events
- **File upload unprotected** — anyone could upload Excel to any event
- **`usersList` unprotected** — leaked all emails and roles publicly
- **Mass assignment in `updateUser`** — entire `req.body` passed to DB update
- **`checkAuth` no try/catch** — malformed JWT caused unhandled 500
- **`createdBy` from client body** — event creator could be spoofed
- **ReDoS in dashboard and slot controllers** — raw user input in MongoDB `$regex`
- **`ProtectedAdmin` checked `user.isAdmin`** — field doesn't exist, blocked all admins
- **OTP stored in plaintext** in MongoDB
- **No rate limiting** on login, signup, OTP endpoints
- **No `helmet`** — no security headers
- **No body size limit** on `express.json()`
- **Weak JWT secret** (`"SECRET_KEY_FILE_APP"`)
- **Raw IP in CORS** with credentials enabled
- **Token logged to console** in auth middleware
- **`signup` allowed self-assigning admin role** from public form

---

## Phase 2 — Scaling Fixes

### Database indexes added
```js
// filedata.model.js
UserSchema.index({ event: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ event: 1, status: 1 });
UserSchema.index({ event: 1, email: 1 }, { unique: true });

// Slots.js
slotSchema.index({ event: 1 });
slotSchema.index({ event: 1, userId: 1 });
slotSchema.index({ event: 1, company: 1, timeSlot: 1 }, { unique: true });

// event.model.js
eventSchema.index({ assignedTo: 1 });
```

### Other scaling fixes
- **Race condition on slot booking** — added duplicate key (11000) error handler
- **Multer no size limit** — added 10MB cap on file upload
- **`deleteMany` pre-hook OOM risk** — rewrote to delete slots by event directly instead of loading all user IDs into memory
- **`startDate`/`endDate` typed as String** in Event model — changed to `Date`
- **MongoDB connection pool** — added `maxPoolSize: 20` to `db.js`
- **`getEventCompanies` null crash** — added null guard when no attendees exist for event

---

## Phase 3 — Bug Fixes

| Bug | Fix |
|---|---|
| Login always failed | `req.body.email` → `req.body` |
| `ProtectedAdmin` blocked admins | `user.isAdmin` → `user.role !== 'admin'` |
| `getCompanyData` returned all slots | Lost company filter during regex fix — restored |
| `EventDetail` showed start date for end date | `formatDateTime(event.startDate)` → `event.endDate` |
| Double fetch in `Meeting.jsx` | Removed duplicate `useEffect(() => fetchData(), [])` |
| N×1 slot fetches in `UserCard` | Removed per-card `fetchSlots` useEffect |
| Null crash in `DefaultPage` search | `event.description.toLowerCase()` → `(event.description || '').toLowerCase()` |
| Regex crash in `UserCard` search highlight | Escaped input before `new RegExp()` |
| URL object memory leak in `DownloadReport` | Wrapped `revokeObjectURL` in `finally` block |
| `DataContext` dead `useParams` call | Removed unused import and call |
| `userId` stored in `localStorage` | Removed — already in React context |
| `CreateEvent` read userId from localStorage | Changed to read from `UserContext` |
| Login form sent whole object as email | Fixed `useAuthStore.login` to accept credentials object |
| Event images not rendering | `EventDetail` used `src={event.image}` — fixed to `BASE_URL + event.image` |
| `userItem.name` undefined in Users table | Changed to `userItem.username` |
| Date validation missing | Added `endDate > startDate` check on both frontend and backend |

---

## Phase 4 — Code Quality

### Backend
- Added `escapeRegex()` helper to `dashboard.controller.js` and `slot.controller.js`
- Whitelisted fields in `updateUser` to prevent mass assignment
- `createdBy` now taken from `req.userId` (auth middleware) not `req.body`
- Removed all `console.log` token/user logging from middleware
- Added `helmet()` as first middleware
- Added `express-rate-limit` on `/api/auth/login` (20 req/15min) and `/api/otp` (5 req/hr)
- Added `express.json({ limit: '1mb' })` body size limit
- Added `PUT /api/auth/profile` endpoint for username updates
- Added `updateProfile` controller and route

### Frontend
- Removed all `alert()` calls — replaced with `ToastContext` system
- Removed `ProtectedLogin` alert before redirect
- Removed `ProtectedAdmin` alerts before redirect
- Removed `axios` dead import from `Signup2.jsx`
- Removed admin role option from `Signup.jsx` and `Signup2.jsx` (public forms)
- Added role selector to `Users.jsx` admin modal (viewer/manager/admin)
- Fixed `Users.jsx` "Add Admin User" → "Add User" with role dropdown
- Added `vite.config.js` missing `@vitejs/plugin-react` plugin

---

## Phase 5 — Role System Fix (S18)

### Problem
Public signup forms (`Signup.jsx`, `Signup2.jsx`) had an admin option in the role dropdown, allowing anyone to self-register as admin.

### Fix
- `Signup.jsx` (public `/signup` route) — role field removed entirely, always sends `role: 'viewer'`
- `Signup2.jsx` (inline modal) — role dropdown limited to viewer/manager only
- `Users.jsx` (admin-only page) — full role selector added (viewer/manager/admin)
- `auth.controller.js` — backend enforcement: `role: 'admin'` in signup payload rejected with 403 unless request comes from an authenticated admin

---

## Phase 6 — Test Suite

### Setup
- Installed `jest`, `supertest`, `@jest/globals`
- Configured Jest for ES modules in `package.json`

### Test files created
- `backend/tests/auth.test.js` — 18 tests covering signup, login, logout, checkAuth, usersList
- `backend/tests/slot.test.js` — 17 tests covering bookSlot, deleteSlot, toggleCompletion, getAllBookedSlots, getCompanyData
- `backend/tests/file.test.js` — 16 tests covering updateUser mass assignment, deleteAllUsers, updateUserStatusByEmail
- `backend/tests/event.test.js` — 18 tests covering createEvent, getAllEvents, getEventById, deleteEvent, updateEvent
- `backend/tests/security.test.js` — 18 tests covering escapeRegex, protectRoute, role enforcement, API key validation

### Result
87/87 tests passing across 5 suites

### Run tests
```bash
npm test
```

---

## Phase 7 — UI Redesign

### Theme
Replaced the light blue gradient "AI slop" design with a dark minimal theme:
- Background: `#0f0f0f`
- Surface: `#1a1a1a`
- Border: `white/10` (5% white opacity)
- Accent: amber (`#f59e0b`)
- Text: `white/80` primary, `white/40` muted

### Layout change
- Replaced top navbar with a fixed left sidebar (220px)
- Sidebar shows contextual event-level links when inside an event route
- User profile footer with dropdown menu (edit profile, sign out)
- Logo is a clickable link back to events list

### Pages redesigned
- **Landing page** (`/`) — dark full-screen with hero text, feature strip, footer
- **Login page** — centered card on dark background, amber CTA button
- **Signup page** — same dark card style
- **Events list** — replaced card grid + hero banner with a clean table
- **Dashboard** — dark stat cards, donut pie chart, bar chart, Ant Design table
- **All modals** — dark background, `white/10` borders
- **Toast notifications** — dark with colored borders (emerald/red/amber/blue)
- **Forgot password / Set password dialogs** — dark theme
- **Edit profile modal** — dark theme with profile/password tabs

### Components created
- `frontend/src/Components/Sidebar.jsx` — full sidebar with nav, profile menu, edit modal
- `frontend/src/Context/ToastContext.jsx` — global toast notification system
- `frontend/src/Pages/LandingPage.jsx` — public landing page

### Components removed
- `frontend/src/Components/Navbar.jsx` — replaced by Sidebar
- `frontend/src/Components/Dashboard/Hero.jsx` — removed hero banner from event page

---

## Phase 8 — Feature Additions

### Profile editing
- `PUT /api/auth/profile` endpoint added (protected)
- Validates username, checks uniqueness against other users
- Frontend: sidebar footer opens profile menu → Edit Profile modal
- Changes persist to DB and survive page reload

### Date validation
- Frontend: end date input has `min` attribute set to start date value
- Frontend: submit validation blocks `endDate <= startDate`
- Backend: same check in `createEvent` and `updateEvent` controllers

### Mock dashboard data
- Dashboard shows sample data (91 attendees, 24 gifts, 5 mock attendees in table) when no event is selected
- Real data loads when an event is selected from the dropdown

### Signup page
- New public `/signup` route with dark-themed form
- Username, email, password, confirm password
- Always creates `viewer` role accounts
- "Create one" link added to login page

### Admin user creation
- Admins create users via `/app/users` page with full role selector
- Backend enforces: only authenticated admins can create admin accounts

---

## Phase 9 — Email (Resend)

### Setup
- Installed `resend` npm package
- Replaced Mailtrap with Resend in `backend/lib/email.js`
- Created `sendEmail()`, `otpHtml()`, `welcomeHtml()` helpers
- Updated `otp.controller.js` to use Resend
- Added `RESEND_API_KEY` and `RESEND_FROM` to `.env`

### Key fix — lazy initialization
Resend client is created inside the function call (not at module level) so `dotenv.config()` runs before the constructor:
```js
const getClient = () => new Resend(process.env.RESEND_API_KEY);
```

### Welcome email removed
Removed welcome email from signup because Resend free tier only sends to the account owner's email without a verified domain. OTP/password-reset emails still use Resend (only needs to reach your own email).

---

## Phase 10 — Routing Restructure

### Before
- `/` → events list (authenticated) or redirect to login
- `/login` → sign in
- `/event/:id` → event dashboard

### After
- `/` → landing page (public)
- `/login` → sign in
- `/signup` → create account
- `/app` → events list (protected)
- `/app/event/:id` → event dashboard
- `/app/event/:id/meeting` → bookings
- `/app/event/:id/company` → companies
- `/app/dashboard` → analytics
- `/app/users` → user management
- `/app/create` → create event
- `/app/event/update/:id` → edit event

---

## Phase 11 — Deployment

### Git
```bash
git init
git add .
git commit -m "Initial commit — MeetApp full stack"
git remote add origin https://github.com/Anand-1105/netwit.git
git branch -M main
git push -u origin main
```

### Backend — Render
- Service: Web Service
- Repo: `Anand-1105/netwit`
- Root directory: `.` (repo root)
- Build command: `npm install`
- Start command: `node backend/server.js`
- URL: `https://netwit-nom1.onrender.com`

Environment variables set in Render dashboard:
```
NODE_ENV=production
PORT=8493
MONGO_URI=<Atlas connection string>
JWT_Token=<secret>
X_API_KEY=<api key>
RESEND_API_KEY=<resend key>
RESEND_FROM=onboarding@resend.dev
CLIENT_URL=https://netwitmeet.vercel.app
```

### Frontend — Vercel
- Repo: `Anand-1105/netwit`
- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- URL: `https://netwitmeet.vercel.app`

Environment variable set in Vercel dashboard:
```
VITE_API_BASE_URL=https://netwit-nom1.onrender.com
```

### CORS fix
Added `https://netwitmeet.vercel.app` to the allowed origins list in `backend/server.js`. `CLIENT_URL` env var is also dynamically included so future domain changes only need a Render env var update.

### Files added for deployment
- `render.yaml` — Render service definition
- `frontend/vercel.json` — SPA rewrite rule for React Router
- `.env.example` — template for backend env vars
- `frontend/.env.example` — template for frontend env vars

---

## Commits Summary

| Commit | Description |
|---|---|
| Initial commit | Full codebase with all fixes |
| Add vercel.json, update tab title and favicon | Amber calendar favicon, "MeetApp — Conference Room Booking" title |
| Move vercel.json into frontend folder | Fixes Vercel UI preset lock |
| Add Vercel frontend config and Render backend config | `render.yaml`, `.env.example` files |
| Fix main entry point path for Render | `package.json` main field |
| Add CLIENT_URL to CORS allowed origins dynamically | `process.env.CLIENT_URL` in CORS list |
| Remove welcome email from signup | Resend only used for OTP |
| Add netwitmeet.vercel.app to CORS | Production CORS fix |

---

## Running Locally

```bash
# Backend
npm install
node backend/server.js   # runs on port 8493

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # runs on port 5173

# Tests
npm test
```

### Seed first admin account
```bash
# Run once, then delete the script
node seed-admin.mjs
# Email: admin@admin.com / Password: admin123
```
