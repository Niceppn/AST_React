# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thai-language textile manufacturing inventory management system. Frontend is React (Vite), backend is Express.js with MySQL.

## Commands

### Frontend (`ast-react/`)
```bash
npm run dev       # Start dev server on port 5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Backend (`server/`)
```bash
npm start         # Run server
npm run dev       # Run with nodemon (hot reload)
```

No test framework is configured in either package.

The Vite dev proxy forwards `/api/*` requests to `http://128.199.238.141:8000`, so the backend doesn't need to run locally for most frontend dev work.

## Architecture

### Two-part structure
- `ast-react/` — React 19 + Vite frontend
- `server/` — Express.js backend on port 8000, connects to remote MySQL DB

### Frontend flow
1. `src/main.jsx` mounts the app
2. `src/App.jsx` checks `localStorage` for user data; sets up Axios interceptors for JWT and 401 auto-logout
3. `src/MyRoute.jsx` defines all routes; role-gated routes are wrapped in `AdminRoute`
4. `src/config/apiBase.jsx` exports `API_BASE_URL` (from `VITE_API_BASE_URL` env var)
5. All API calls use Axios: `axios.get(`${API_BASE_URL}/api/endpoint`)`

### Authentication & roles
- Login POSTs to `/api/auth/login`, which returns `{ token, user }`. Both are saved to `localStorage`.
- Axios request interceptor attaches `Authorization: Bearer <token>` to every request.
- Axios response interceptor clears storage and reloads on any 401.
- `AdminRoute` component gates pages by role — checked **client-side only** against `localStorage`.
- Valid roles: `admin`, `superadmin`, `materialstaff`, `supermaterialstaff`
- JWT expires in 8 hours (`JWT_EXPIRES_IN` env var). Passwords stored as bcrypt hashes (10 rounds).

### Backend MVC structure
```
server/
  index.js              # Express app, CORS, middleware, route registration
  config/database.js    # mysql2/promise connection pool
  middleware/auth.js    # verifyToken middleware (extracts { id, email, user_type } onto req.user)
  routes/               # Route files (userRoutes, orderRoutes, dashboardRoutes, etc.)
  controller/           # Business logic (userController, orderController, dashboardController, authentification)
  model/                # DB query methods (user, order, stock, blog)
```

All data endpoints are protected: `app.use('/api/orders', verifyToken, orderRoutes)`.

### Database query pattern
All queries use parameterized `pool.execute()`:
```javascript
const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
const [result] = await pool.execute('INSERT INTO users (...) VALUES (?, ?)', [a, b]);
// result.insertId for inserts, result.affectedRows for update/delete
```

Dynamic WHERE clause construction is used in several routes — build `where[]` and `params[]` arrays, then join:
```javascript
const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
const [rows] = await pool.execute(`SELECT * FROM table ${whereSQL} LIMIT ?`, [...params, limit]);
```

### Adding a new feature

**Backend** — create `routes/newRoutes.js`, `controller/newController.js`, optionally `model/newModel.js`, then register in `index.js`:
```javascript
app.use('/api/new-feature', verifyToken, require('./routes/newRoutes'));
```

**Frontend** — create `src/Components/NewFeature.jsx`, add a `<Route>` in `MyRoute.jsx`, and add a menu entry in `Sidebar.jsx`.

### Key UI patterns
- Bootstrap 5 + React Bootstrap for layout and components
- Chart.js / react-chartjs-2 for dashboard charts
- ExcelJS + file-saver for Excel export (used in `ExportFabric*.jsx` components)
- Thai language UI throughout; Thai month names used in date formatting
- Console logging uses emoji prefixes (`✅`, `❌`, `🔍`) throughout the backend

### Environment variables
- `ast-react/.env.development` — `VITE_API_BASE_URL=http://localhost:8000`
- `ast-react/.env.production` — `VITE_API_BASE_URL=https://dashboard.ast-manufacturing.com`
- Root `.env` — MySQL credentials and `JWT_SECRET` / `JWT_EXPIRES_IN` for the backend

### Path alias
`@/` resolves to `ast-react/src/` (configured in `vite.config.js`).
