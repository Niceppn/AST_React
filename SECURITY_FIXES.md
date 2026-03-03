# Security Fixes — Critical Issues

**Date:** 2026-02-18
**Files changed:** `server/index.js`, `ast-react/src/App.jsx`

---

## Fixes Applied

### 1. Removed `/api/auth/debug-user` endpoint
**File:** `server/index.js` (was lines 208–229)
**Severity:** 🔴 CRITICAL

**Problem:** Public POST endpoint that accepted any email address and returned the user's stored password hash directly in the response body. Any attacker could harvest all password hashes without authentication.

**Fix:** Endpoint removed entirely. A comment was left noting that password management must go through the user management page with proper authentication.

---

### 2. Removed `/api/auth/update-password` endpoint
**File:** `server/index.js` (was lines 162–206)
**Severity:** 🔴 CRITICAL

**Problem:** Any caller (unauthenticated) could POST `{ email, newPassword }` and overwrite the password of any user in the database. The response also returned the new bcrypt hash unnecessarily.

**Fix:** Endpoint removed entirely.

---

### 3. Restricted CORS to known origins
**File:** `server/index.js` (line 26)
**Severity:** 🔴 HIGH

**Problem:** `app.use(cors())` with no configuration allowed **any** origin to make cross-origin requests, including credentials.

**Fix:** Replaced with an allowlist:
```js
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dashboard.ast-manufacturing.com',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```
To add more origins, append to `allowedOrigins`.

---

### 4. Removed debug SQL query from login endpoint
**File:** `server/index.js` (was lines 44–62 inside `POST /api/auth/login`)
**Severity:** 🔴 HIGH

**Problem:** Before every login attempt a separate SQL query ran: `SELECT ... LEFT(password, 20) as password_preview ...` and the partial hash was printed to server logs (`console.log`). This meant the first 20 characters of each user's bcrypt hash were written to stdout on every login attempt.

**Fix:** The entire debug block was removed. The endpoint now calls `User.authenticate()` directly, which is the only query needed.

---

### 5. Fixed `stockfabrics` crash on DB error (undefined `mockData`)
**File:** `server/index.js` (was line 416)
**Severity:** 🟠 BUG (would cause 500 crash worse than the original error)

**Problem:** On a database error the catch block attempted `res.json(mockData)` where `mockData` was never defined, causing a `ReferenceError` and a non-standard crash response instead of a clean 500.

**Fix:** Replaced with a proper error response:
```js
res.status(500).json({
  success: false,
  message: 'เกิดข้อผิดพลาดในการดึงข้อมูล stockfabrics',
  error: error.message,
});
```

---

### 6. Removed user-data console.log in frontend App.jsx
**File:** `ast-react/src/App.jsx` (lines 24, 35, 41)
**Severity:** 🟡 LOW

**Problem:** Three `console.log` calls printed the full user object (including `user_type` and email) to the browser console on login, logout, and page refresh. This leaks role and identity information visible in browser DevTools.

**Fix:** All three `console.log` statements removed.

---

## Remaining Critical Items (Not Yet Fixed)

These require larger architectural changes and are tracked in `REVIEW.md`:

| # | Issue | Why deferred |
|---|-------|-------------|
| 1 | **No JWT / server-side sessions** — `AdminRoute` is client-side only | Requires adding `jsonwebtoken`, auth middleware on every route, and frontend token storage strategy |
| 2 | **No backend authorization on data endpoints** — `/api/fabricouts`, `/api/stockfabrics` etc. require no login | Blocked on JWT implementation above |
| 3 | **No rate limiting on auth endpoints** | Requires `express-rate-limit` package and configuration |
| 4 | **`host: true` in vite.config.js** | Intentional for LAN development access; change to `host: 'localhost'` before deploying dev server on untrusted networks |
| 5 | **Register endpoint allows any `user_type`** — caller can self-assign `admin` role | Requires server-side role validation on register |
