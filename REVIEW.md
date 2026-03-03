# Project Code Review — AST React

**Date:** 2026-02-18
**Scope:** Full review of frontend (`ast-react/`) and backend (`server/`)

---

## Table of Contents

1. [Backend Review](#backend-review)
2. [Frontend Review](#frontend-review)
3. [Cross-Project Issues](#cross-project-issues)
4. [Critical Issues Summary](#critical-issues-summary)
5. [Recommendations](#recommendations)

---

## Backend Review

### `server/index.js`

**Purpose:** Express.js server for authentication, user management, fabric/stock data APIs, and static frontend serving.

#### Security Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 CRITICAL | `/api/auth/debug-user` endpoint exposes password hashes publicly | Lines 208–229 |
| 🔴 CRITICAL | No authentication guard on any data endpoint (fabricouts, stockfabrics, etc.) | Throughout |
| 🔴 CRITICAL | `/api/auth/update-password` allows anyone to change any user's password — no auth check | Lines 162–206 |
| 🔴 HIGH | `cors()` allows all origins — should whitelist known domains | Line 26 |
| 🔴 HIGH | Password hashes returned in update-password response body | Line 190 |
| 🟡 MEDIUM | `console.log` outputs email and partial hash before/during login | Lines 44, 49–55 |
| 🟡 MEDIUM | Default role for new users is `materialstaff` — grants unintended access | Line 101 |
| 🟡 MEDIUM | No rate limiting on auth endpoints | — |
| 🟡 MEDIUM | No HTTPS enforcement | — |

#### Code Quality Issues

- **No JWT/session authentication.** `/api/auth/me` is stub that returns `null` (Line 158). All auth state is managed purely in browser localStorage — completely bypassable.
- **Duplicate bcrypt import** — `bcrypt` imported at top and re-required inside a function (Lines 6, 176).
- **No input validation** — no password-strength check, no email format validation on registration.
- **No startup validation of `.env`** — missing required env vars cause silent runtime failures.

#### Performance Issues

- No pagination limit enforcement — `fabricouts` endpoint allows `limit=15000` (Line 305), returning massive datasets.
- Redundant debug query runs before every login attempt (Lines 47–62).
- No query result caching for repeated identical requests.

#### Maintainability Issues

- All routes, auth logic, and static serving in a single `index.js` file — should be split into route modules.
- Magic numbers for salt rounds, server port, and query limits should be named constants.
- Inconsistent route naming: `/api/orders`, `/api/order`, `/api/purchase-orders`.

---

### `server/package.json`

- **Duplicate dependencies:** both `bcrypt` and `bcryptjs` are listed — only one is needed.
- **`axios` listed as a dependency** but not used in `index.js`.
- **`nodemon` in `dependencies`** — should be in `devDependencies`.
- **Missing security packages:** `helmet` (security headers), `express-rate-limit`, `jsonwebtoken` (JWT).

---

## Frontend Review

### `src/App.jsx`

- `localStorage` parsed without a try/catch — corrupt data crashes the entire app (Line 22).
- No session timeout — users remain logged in indefinitely.
- No error boundary around the app tree.

---

### `src/MyRoute.jsx`

- Role arrays are repeated inline across every route — should be a shared constant/config.
- `ExportFabricServerExport` imported but route path appears to have a typo (Line 25).
- All permission logic is client-side only — no backend enforcement.

---

### `src/config/apiBase.jsx`

- Production backend IP `128.199.238.141` is hardcoded in `vite.config.js` (Line 19) and visible in source — move to env variable.

---

### `src/Components/Login.jsx`

#### Security Issues

- Password sent over HTTP in dev (no HTTPS enforcement).
- Error message "Email or Password incorrect" is too specific — allows user enumeration. Use a generic message.
- `localStorage.setItem('user', ...)` stores unencrypted user data including role.

#### Code Quality Issues

- **300+ lines of inline CSS-in-JS** — should be a CSS module.
- Inline style string has syntax error: `background: ')'` (Line 108) — incomplete value breaks the overlay.
- DOM manipulation (`element.style.xxx`) inside event handlers instead of CSS class toggling — causes DOM thrashing.
- Only empty-field validation; no email format check.

---

### `src/Components/Sidebar.jsx`

- External image URL hardcoded with no fallback if the external service is unavailable (Line 90).
- `user_type` vs `userType` field name inconsistency (Line 106).
- Menu item config is mixed into JSX — extract to a config array.
- After logout, navigates to `/login` then calls `window.location.reload()` — redundant (App.jsx already handles redirect).

---

### `src/Components/Dashboard.jsx`

#### Performance Issues

- **4 separate API calls on mount** (Lines 48–52) — should be batched into a single endpoint.
- Chart data objects are recalculated on every render — wrap in `useMemo`.
- Fetch functions recreated on every render — wrap in `useCallback`.
- No pagination or lazy loading — all data fetched at once.

#### Code Quality Issues

- 4 nearly identical fetch functions (fetchDashboardStats, fetchTopFabrics, fetchCustomerData, fetchThreadData) — consolidate with a generic helper.
- 20 hardcoded color values duplicated across three pie charts — extract to a constant.
- String parsing relies on exact delimiters (` * `, ` / `) in data — will silently break if format changes (Lines 84–85, 186–189).
- 700+ line single component — split into sub-components (PieChart, StatsCard, etc.).

---

### `src/Components/Orders.jsx`

- Complex filter/group logic (100+ lines) lives directly in the component — extract to a custom hook or utility function.
- String-delimiter parsing fragile (Lines 160–161, 179–181).
- Multiple separate `setState` calls (Lines 116, 127, 156, 174, 197) — causes cascade of re-renders; batch with `useReducer`.

---

### `src/Components/Users.jsx`

- **Runtime crash:** `fallbackUsers` variable is referenced but never defined (Line 63).
- No actual edit functionality — only add and delete.
- Full user list refetched after every add instead of appending locally.
- No pagination — all users loaded in one request.

---

### `src/Components/Stock.jsx`

- Delete button has no `onClick` handler — non-functional (Line 323).
- View (eye icon) button does nothing (Line 320).
- Uses `document.getElementById()` to read input values instead of `useRef` (Lines 298–299).
- No API call wired to the save button for updates.

---

### `src/Components/AdminRoute.jsx`

#### Security Issues (Critical)

- **Completely bypassable:** reads role from `localStorage` only — any user can open DevTools, edit `localStorage`, and gain admin access.
- No session/token validated against backend.
- Error message reveals role names required for access — aids attackers.

---

### `src/Components/ExportFabric.jsx`

- **1500+ line component** — the largest file in the project. Needs to be split into:
  - Data-fetching layer (custom hook or service)
  - Filter/search UI component
  - Results table component
  - Three separate Excel export functions
- **50+ `console.log` statements** left in production code (Lines 78–133).
- Three different Excel export implementations with duplicated formatting logic (Lines 296–690, 695–852, 857–1028).
- All 15 000+ record filtering done in JavaScript — should be done on the backend.
- No access control — any authenticated user can export all data.

---

### `src/Components/ExportFabricA4.jsx`

- `useMemo` dependency array missing `filters` — stale computed values possible (Lines 150–202).
- No date validation before building filter dates (Lines 57–66).

---

### `src/Components/RawMaterialInventory.jsx`

- Manual string checks against `null`, `'null'`, `'{'` to filter invalid data — fragile (Lines 54–62).
- `Math.round` on weights loses precision (Lines 76–77).

---

### `vite.config.js`

- **`host: true`** exposes the dev server on all network interfaces — should be `'localhost'` in dev (Line 14).
- Backend IP `128.199.238.141:8000` hardcoded — move to env variable.

---

## Cross-Project Issues

### Authentication & Authorization

| Issue | Impact |
|-------|--------|
| No JWT or server-side sessions | Any user can fake login by writing to localStorage |
| No backend role validation | Any API endpoint callable without authentication |
| No CSRF tokens | Cross-site request forgery possible |
| No session timeout | Stolen sessions valid indefinitely |

### Data Consistency

- `user_type` (backend DB column) vs `userType` (frontend object) — inconsistent naming causes subtle bugs.
- API responses inconsistent: some return `{ data: [] }`, others return `[]` directly — components have multiple parsing strategies to compensate.

### Code Duplication

- Date formatting logic repeated in every component — no shared utility.
- Thai month names array defined in multiple files.
- Role mapping objects defined separately in `AdminRoute`, `MyRoute`, `Sidebar`, `Users`.
- Color constants repeated across Dashboard, ExportFabric, and other components.

### Missing Infrastructure

- **Zero test files** across the entire project.
- No `i18n` system — Thai text hardcoded in dozens of locations.
- No shared constants file for roles, colors, API limits, or date formats.
- No custom hooks for data fetching — same `useEffect` + `axios` pattern repeated everywhere.
- No `.env.example` — new developers have no reference for required variables.

---

## Critical Issues Summary

### 🔴 Security (Must Fix)

1. Debug endpoint `/api/auth/debug-user` exposes password hashes — **remove immediately**
2. Password update endpoint requires no authentication — anyone can change any password
3. `AdminRoute` is entirely client-side — backend has no authorization checks
4. `CORS` allows all origins — restrict to known domains
5. Stale/corrupt `localStorage` data causes crashes and XSS exposure surface
6. Dev server exposed on all network interfaces (`host: true`)

### 🟠 Bugs (Will Cause Runtime Errors)

1. `fallbackUsers` used but never defined in `Users.jsx` — crash on error state
2. `background: ')'` syntax error in `Login.jsx` — broken overlay style
3. Stock.jsx delete button has no handler — feature non-functional
4. `useMemo` missing dependencies in `ExportFabricA4.jsx` — stale summaries

### 🟡 Performance

1. Dashboard makes 4 API calls on every mount — batch into one endpoint
2. `ExportFabric.jsx` loads and filters 15 000+ rows in the browser — move to backend
3. No `useCallback`/`useMemo` on expensive operations in Dashboard and Orders
4. No pagination anywhere in the application

### 🔵 Maintainability

1. `ExportFabric.jsx` is 1 500+ lines — needs decomposition
2. No shared constants for roles, colors, Thai month names, API limits
3. 50+ `console.log` statements left in `ExportFabric.jsx`
4. No test coverage

---

## Recommendations

**Priority 1 — Security (before next production deploy)**
- Remove `/api/auth/debug-user` endpoint
- Add authentication middleware (JWT) to all data endpoints
- Add server-side role authorization checks
- Fix CORS to whitelist specific origins
- Fix `host: true` in vite.config.js

**Priority 2 — Bug fixes**
- Fix undefined `fallbackUsers` in `Users.jsx`
- Fix `background: ')'` syntax in `Login.jsx`
- Wire up delete handler in `Stock.jsx`
- Add missing `filters` to `useMemo` deps in `ExportFabricA4.jsx`

**Priority 3 — Architecture improvements**
- Extract shared constants: roles, colors, Thai month names
- Create utility functions: date formatting, currency formatting
- Move heavy data filtering (ExportFabric) to backend with proper pagination
- Split `ExportFabric.jsx` into focused components
- Add custom hooks (`useFetch`, `useExportFabric`) to reduce duplication

**Priority 4 — Quality**
- Add try/catch around all `localStorage` access
- Replace `console.log` with a proper logger or remove debug logs
- Add at least smoke tests for auth flow and critical data displays
- Add `.env.example` files for both frontend and backend
