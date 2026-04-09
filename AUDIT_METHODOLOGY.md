# Audit Methodology — How the Codebase Was Analyzed

> This document explains the step-by-step process used to find security vulnerabilities,
> scaling issues, bugs, and code quality problems in the MeetApp codebase.
> No automated scanners were used. Everything was done through manual static analysis.

---

## 1. Starting Point — Understanding the Project

Before looking for problems, the goal was to understand what the application actually does.

**First reads:**
- `README.md` and `package.json` (root + frontend) — to understand the project name, scripts, and dependency list
- `docker-compose.yml` — to understand the deployment topology (3 services: MongoDB, backend, frontend/Nginx)
- `backend/server.js` — the Express entry point, which reveals the full middleware chain, all route prefixes, and CORS configuration
- `frontend/src/main.jsx` and `frontend/src/App.jsx` — to understand how the frontend is bootstrapped, what contexts wrap the app, and what routes exist

This gave a complete map of the system before reading a single controller or component.

---

## 2. Mapping the Attack Surface

The next step was to enumerate every API endpoint and note which ones had authentication middleware.

**Files read in this phase:**
- All 7 route files: `auth.routes.js`, `event.route.js`, `file.routes.js`, `slot.routes.js`, `dashboard.routes.js`, `otp.routes.js`, `user.routes.js`

**What was looked for:**
- Which routes use `protectRoute` middleware
- Which routes use `isAdmin` middleware
- Which routes have no middleware at all

This produced the API reference table in the analysis and immediately surfaced the most critical finding: the majority of write routes (all slot routes, event mutation routes, file upload) had zero authentication.

**The pattern that revealed it:**
```js
// slot.routes.js — no protectRoute on any route
router.post('/booking-slot', bookSlot);
router.delete('/slot/delete/:id', deleteSlot);
router.post('/slot/toggle-completed/:id', toggleCompletion);
```
Compared to routes that correctly use it:
```js
// user.routes.js — correctly protected
router.use(protectRoute);
router.get('/', getAllUsers);
```

---

## 3. Reading Every Controller

Each controller was read in full, looking for:

### 3a. Input Handling
- Does the controller validate and sanitize inputs before using them?
- Is user input passed directly into MongoDB queries (injection risk)?
- Is user input used to construct regex patterns (ReDoS risk)?

**Finding — ReDoS in dashboard.controller.js:**
```js
// Raw user input directly in $regex
{ firstName: { $regex: search, $options: 'i' } }
```
A malicious input like `(a+)+$` causes catastrophic backtracking in the regex engine.

**Finding — ReDoS in slot.controller.js:**
```js
company: { $regex: `^${companyName}$`, $options: 'i' }
```
Same issue — `companyName` comes from `req.params` with no escaping.

### 3b. Authentication and Authorization
- Does the controller check `req.user` or `req.userId`?
- Does it verify the requesting user has permission to act on the resource?
- Is there any IDOR (Insecure Direct Object Reference) risk?

**Finding — mass assignment in file.controller.js:**
```js
const updateFields = req.body; // entire body
await UserCollection.findByIdAndUpdate(id, updateFields, { new: true });
```
No field whitelist — a caller can overwrite any field including `event`, `giftCollected`, `status`.

**Finding — createdBy spoofing in event.controller.js:**
```js
const { createdBy } = req.body; // client-supplied
```
Any authenticated user can claim to be any creator.

### 3c. Error Handling
- Are errors caught properly?
- Do error responses leak internal details (stack traces, error messages)?
- Are there unhandled promise rejections?

**Finding — unhandled jwt.verify in auth.controller.js:**
```js
// checkAuth — no try/catch
const decoded = jwt.verify(token, process.env.JWT_Token);
```
A malformed token throws synchronously and produces an unhandled 500.

### 3d. Data Flow
- Where does data come from (req.body, req.params, req.query, req.cookies)?
- Where does it go (DB write, response, external service)?
- Is sensitive data returned in responses?

**Finding — login destructuring bug:**
```js
const { email, password } = req.body.email;
// req.body.email is a string, not an object
// destructuring a string gives undefined for both fields
```
This was found by tracing the exact data flow: `req.body` → destructure → `User.findOne({ email })` → `bcrypt.compare(password, ...)`. When `email` is `undefined`, `User.findOne` returns null and the function returns "User Not Found" for every login attempt.

---

## 4. Reading Every Model

Each Mongoose schema was read to check:

- **Index coverage** — are the fields that appear in `.find()`, `.findOne()`, and aggregation `$match` stages actually indexed?
- **Type correctness** — are fields typed appropriately for how they're queried?
- **Cascade behavior** — do pre-hooks correctly clean up related documents?
- **Uniqueness constraints** — are uniqueness rules enforced at the DB level or only in application code?

**Finding — missing indexes:**
Cross-referencing the controllers with the models revealed that `UserCollection.event` is used in virtually every query but has no index. Same for `Slots.event`, `Slots.userId`, `Slots.company`.

**Finding — startDate/endDate typed as String:**
```js
startDate: { type: String, required: true }
```
The Event model stores dates as strings. This means MongoDB cannot sort or range-query on them correctly. Found by comparing the schema type against how the field is used in queries and displayed in the frontend.

**Finding — deleteMany pre-hook loads all IDs into memory:**
```js
const users = await mongoose.model('UserCollection').find(filter, '_id');
const userIds = users.map(u => u._id);
await mongoose.model('Slot').deleteMany({ userId: { $in: userIds } });
```
For an event with 10,000 attendees, this loads 10,000 ObjectIds into Node's heap before the delete. Since `Slot` already has an `event` field, the fix is to delete by event directly.

---

## 5. Reading Every Route File Against Its Controller

Each route was matched to its controller function to verify:

- The middleware chain is correct
- The HTTP method matches the operation (GET for reads, DELETE for deletes, etc.)
- Route parameters match what the controller expects

**Finding — `usersList` unprotected:**
```js
// auth.routes.js
router.post("/users-list", usersList); // no protectRoute
```
The controller returns usernames, emails, and roles for all system users. This is used by `CreateEvent` and `UpdateEvent` to populate the "Assign To" dropdown — but because it has no auth, anyone can enumerate all users.

---

## 6. Reading the Middleware

`auth.middleware.js` was read to understand exactly what `protectRoute` does and what it attaches to the request object.

**What was verified:**
- It reads the JWT from `req.cookies.token`
- It calls `jwt.verify` and attaches `req.userId` and `req.user`
- It calls `User.findById` on every request (a DB hit per authenticated request — no caching)

**Finding — token logged to console:**
```js
console.log("Token from cookies:", token);
```
JWT tokens appear in server logs in production. Anyone with log access can extract valid tokens.

---

## 7. Reading the Configuration Files

**`.env`** — read to check what secrets are present and whether they're weak:
- MongoDB URI contains a real password
- JWT secret is `"SECRET_KEY_FILE_APP"` — short, dictionary-guessable
- API key is present in plaintext

**`mailtrap.config.js`** — read to check how the email client is configured:
```js
const TOKEN = "48295a46cac835ce2b77e385b0f56840"; // hardcoded
```
This is the most severe finding in the codebase — a real API credential committed directly in source code, not even in `.env`.

**`docker-compose.yml`** — read to check the deployment configuration:
- MongoDB port `27017` exposed to the host
- `VITE_API_BASE_URL` defaults to a raw HTTP IP address
- No health checks, no resource limits

---

## 8. Reading the Frontend — Context and State

The three context files were read to understand how state flows through the app:

- `UserContext.jsx` — auth state, login/logout/signup
- `DataContext.jsx` — attendee data per event
- `SlotsContext.jsx` — booked slots per event

**Finding — DataContext calls useParams internally:**
```js
const { id } = useParams(); // inside the context provider
```
This couples the context to the router. The extracted `id` is never used inside the context body — it's dead code that also means the context only works when rendered inside a route with an `:id` param.

**Finding — userId stored in localStorage:**
```js
localStorage.setItem("userId", response.user._id);
```
The user object is already in React state. Storing the ID in localStorage is redundant and slightly increases XSS surface (localStorage is accessible to any JavaScript on the page, unlike httpOnly cookies).

---

## 9. Reading the Frontend — Protected Routes

`ProtectedLogin.jsx` and `Admin.jsx` were read to understand how route guards work.

**Finding — ProtectedAdmin checks wrong property:**
```js
if (!user.isAdmin) { // isAdmin doesn't exist on the User model
```
The User model uses `role: "admin"`, not a boolean `isAdmin`. This means `user.isAdmin` is always `undefined` (falsy), so every authenticated user — including actual admins — gets redirected away from the `/signup` route. The admin-only page is effectively inaccessible to everyone.

---

## 10. Reading Every Page and Component

Each page and component was read to find:

- Duplicate API calls (N+1 patterns)
- Missing null/undefined guards that would cause runtime crashes
- UX issues (alert() usage, missing loading states)
- Logic bugs in data transformation
- Duplicated code

**Finding — double fetch in Meeting.jsx:**
```js
useEffect(() => { if (id) { fetchData(id); } }, [id]);
useEffect(() => { fetchData(); }, []); // fires again on same mount
```
Two separate effects both fire when the component mounts, causing two simultaneous API calls every time the page loads.

**Finding — N×1 slot fetches in UserCard:**
```js
useEffect(() => {
  if (eventId) { fetchSlots(eventId); }
}, [eventId]);
```
This `useEffect` is inside `UserCard`. If 50 attendee cards are rendered, 50 identical `POST /slot/get-all-booked-slots` requests fire simultaneously on page load.

**Finding — null crash in DefaultPage:**
```js
event.description.toLowerCase().includes(searchTerm.toLowerCase())
```
`description` is optional in the Event schema. If any event has no description, this throws `Cannot read properties of null` and the entire event list goes blank.

**Finding — copy-paste bug in EventDetail.jsx:**
```js
<span>{event.endDate ? formatDateTime(event.startDate) : "N/A"}</span>
//                                    ^^^^^^^^^^^ wrong field
```
The end date display uses `event.startDate` instead of `event.endDate`.

**Finding — UserCard regex crash:**
```js
const regex = new RegExp(`(${searchQuery})`, "gi");
```
If a user types a regex special character like `(`, `[`, or `+` in the search box, `new RegExp()` throws a `SyntaxError` and the component crashes.

---

## 11. Reading the Package Files

`package.json` (root) and `frontend/package.json` were read to audit dependencies.

**What was checked:**
- Are any packages known to be unmaintained or have CVEs?
- Are there packages installed but never imported?
- Are there redundant packages that duplicate built-in functionality?

**Finding — `xlsx` is unmaintained:**
SheetJS community edition (`xlsx@0.18.5`) has not received security updates and has known CVEs. `exceljs` is already a frontend dependency and is actively maintained.

**Finding — `crypto` npm package is redundant:**
```json
"crypto": "^1.0.1"
```
`crypto` is a Node.js built-in module. The npm package is a no-op shim that does nothing. It adds to the dependency tree for no reason.

**Finding — `zustand` installed but unused:**
`zustand@^5.0.3` is in `frontend/package.json` but no Zustand store files exist anywhere in the codebase. The app uses React Context for all state management.

**Finding — `react-hot-toast` installed but never used:**
`react-hot-toast@^2.5.1` is installed but `alert()` is used throughout the app for all user feedback. The library is never imported.

---

## 12. Cross-Referencing Frontend Calls Against Backend Routes

For each frontend API call, the corresponding backend route and controller were verified to ensure:

- The endpoint exists
- The HTTP method matches
- The expected request shape matches what the controller reads
- The response shape matches what the frontend expects

This cross-referencing found the login bug definitively:

```js
// Frontend (useAuthStore.js) — sends correct shape
await Axios.post("/auth/login", { email, password });
// req.body = { email: "user@example.com", password: "secret" }

// Backend (auth.controller.js) — reads wrong shape
const { email, password } = req.body.email;
// req.body.email = "user@example.com" (a string)
// destructuring a string: email = undefined, password = undefined
```

---

## 13. Checking the Deployment Configuration

`docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, and `frontend/nginx.conf` were read together to understand the full deployment picture.

**What was checked:**
- Are any ports unnecessarily exposed?
- Is traffic encrypted end-to-end?
- Are secrets injected correctly at runtime vs baked into images?
- Are there health checks and restart policies?
- Does the architecture support horizontal scaling?

**Finding — MongoDB port exposed:**
```yaml
mongodb:
  ports:
    - "27017:27017" # exposed to host network
```
In production, this means the database is reachable from outside the Docker network if the host firewall isn't configured. The backend can reach MongoDB via the internal Docker network (`file-app-network`) without this port mapping.

**Finding — image storage blocks scaling:**
Event images are stored in `backend/public/uploads/events/` via a Docker volume mount. If the backend is scaled to multiple replicas, each replica has its own filesystem and images uploaded to one replica won't be visible from others.

---

## Summary of Testing Approach

| Phase | Method | Files Read |
|---|---|---|
| Project understanding | Read entry points and config | `server.js`, `main.jsx`, `App.jsx`, `docker-compose.yml`, `package.json` |
| Attack surface mapping | Read all route files, note middleware | All 7 route files |
| Input validation audit | Read all controllers, trace data flow | All 7 controllers |
| Schema audit | Read all models, cross-ref with queries | All 5 models |
| Auth/authz audit | Read middleware + protected routes | `auth.middleware.js`, `ProtectedLogin.jsx`, `Admin.jsx` |
| Config audit | Read all config and env files | `.env`, `mailtrap.config.js`, `vite.config.js` |
| State management audit | Read all context providers | `UserContext.jsx`, `DataContext.jsx`, `SlotsContext.jsx` |
| Component audit | Read all pages and components | All 12 pages, all 10 components |
| Dependency audit | Read package files, check known issues | `package.json`, `frontend/package.json` |
| Deployment audit | Read Docker and Nginx config | `docker-compose.yml`, `nginx.conf`, both Dockerfiles |
| Cross-referencing | Match frontend calls to backend routes | `useAuthStore.js`, `Api.jsx`, `Axios.jsx` vs all routes |

**Total files read: 60+**
**Method: 100% manual static analysis — no automated scanners, no runtime testing**

All findings were verified by reading the actual code, not inferred from patterns alone.
Every fix recommendation includes the exact line or block that needs to change.
