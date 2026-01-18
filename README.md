# Full Stack Coding Challenge: Secure Task Management System

**Repository:** `bakbar-7f3a2c1b-9e4d-4f2a-b8c9-5d6e7f8a9b0c`

A secure, role-based task management system built with **NestJS**, **Angular 17**, and **NX monorepo** architecture.

---
## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+ - [Download](https://nodejs.org/)
- **npm** v9+
---

## 🎯 Quick Start - Test Login Credentials

Use these accounts after running `npm run seed`:

| Role | Email | Password | What You Can Do |
|------|-------|----------|----------------|
| **Owner** 👑 | `owner@turbovets.com` | `Password123!` | Everything + child orgs + audit logs |
| **Admin** ⚙️ | `admin@turbovets.com` | `Password123!` | Create/edit/delete tasks + child orgs |
| **Viewer** 👀 | `viewer@turbovets.com` | `Password123!` | Read-only (can't create/edit/delete) |
| **Child Org Admin** 🏢 | `admin@engineering.turbovets.com` | `Password123!` | Only Engineering dept tasks |

### 🚀 Setup & Run (3 Commands)

```bash
npm install          # Install dependencies
npm run seed         # Create sample data
npm run serve:all    # Start backend + frontend
```

**Open:** http://localhost:4200/login

---

## 📋 Tech Stack

- **Backend:** NestJS 10 + TypeORM + SQLite + Passport JWT
- **Frontend:** Angular 17 (Standalone) + TailwindCSS + Angular CDK
- **Monorepo:** NX 17
- **Auth:** Real JWT (bcrypt hashing, 24h expiration)
- **Testing:** Jest (92% backend, 87% frontend coverage)

---

## 🗃️ Monorepo Structure

```
bakbar-7f3a2c1b-9e4d-4f2a-b8c9-5d6e7f8a9b0c/
├── apps/
│   ├── api/                      # NestJS Backend
│   │   └── src/app/
│   │       ├── auth/             # Login, register, JWT
│   │       ├── tasks/            # Task CRUD + RBAC
│   │       ├── users/            # User management
│   │       ├── organizations/    # Org hierarchy
│   │       └── audit/            # Action logging
│   │
│   └── dashboard/                # Angular Frontend
│       └── src/app/
│           ├── auth/login/       # Login page
│           ├── tasks/            # Task dashboard + modals
│           ├── core/             
│           │   ├── guards/       # Auth guard
│           │   ├── interceptors/ # JWT interceptor
│           │   └── services/     # Auth, Task, Notification
│           └── shared/           # Notification component
│
├── libs/
│   ├── data/                     # Shared interfaces & DTOs
│   └── auth/                     # RBAC guards & decorators
│
└── package.json
```

---

## 📊 Database Schema & RBAC

### Entity Relationships

```
┌─────────────────┐
│ Organizations   │  (2-level hierarchy: TurboVets HQ → Engineering/Sales)
│  - id, name     │
│  - parentId     │
└────────┬────────┘
         │ 1:N
┌────────▼────────┐         ┌──────────────┐
│     Users       │────────▶│    Roles     │
│  - email        │   N:1   │  - name      │
│  - password     │         │  - permissions
│  - orgId        │         └──────────────┘
│  - roleId       │         (Owner, Admin, Viewer)
└────────┬────────┘
         │ 1:N
┌────────▼────────┐         ┌──────────────┐
│     Tasks       │         │  AuditLogs   │
│  - title        │────────▶│  - userId    │
│  - status       │   1:N   │  - action    │
│  - priority     │         │  - timestamp │
│  - userId       │         └──────────────┘
│  - orgId        │
└─────────────────┘
```

### Role Permissions

| Role | Create | Read | Update | Delete | Audit Logs | Org Scope |
|------|--------|------|--------|--------|------------|-----------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | Own + ALL child orgs |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | Own + child orgs |
| **Viewer** | ❌ | ✅ | ❌ | ❌ | ❌ | Own org ONLY |

### How Organization Hierarchy Works

```
TurboVets HQ (ID: 1)
├── Engineering (ID: 2)  ← Child org
└── Sales (ID: 3)        ← Child org
```

- **Owner at HQ** → sees ALL tasks (HQ + Engineering + Sales)
- **Admin at Engineering** → sees ONLY Engineering tasks
- **Viewer at HQ** → sees ONLY HQ tasks (NOT Engineering/Sales)

---

## 🔐 Authentication & Security

### How JWT Auth Works

```
1. POST /api/auth/login { email, password }
   ↓
2. Backend validates bcrypt hash
   ↓
3. Returns JWT token (24h expiration)
   ↓
4. Frontend stores in localStorage
   ↓
5. HTTP Interceptor adds "Authorization: Bearer <token>" to all requests
   ↓
6. JwtAuthGuard validates token on every endpoint
```

### Security Layers

```
HTTP Request
    ↓
1. JwtAuthGuard → Validate token signature & expiration
    ↓
2. PermissionsGuard → Check user has required permission
    ↓
3. Service Layer → Verify org access & ownership
    ↓
4. AuditLog → Record action to database
    ↓
Response
```

### Security Features

- ✅ **Bcrypt password hashing** (10 rounds)
- ✅ **JWT tokens** with 24h expiration
- ✅ **CORS protection** (only localhost:4200 allowed)
- ✅ **Input validation** (class-validator DTOs)
- ✅ **SQL injection prevention** (TypeORM parameterized queries)
- ✅ **XSS protection** (Angular sanitization)
- ✅ **Audit logging** (all actions tracked)

---

## 📡 API Endpoints

### Authentication

#### `POST /api/auth/login`
```json
// Request
{ "email": "owner@turbovets.com", "password": "Password123!" }

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "owner@turbovets.com",
    "role": "Owner",
    "organizationId": 1
  }
}
```

### Tasks (All require JWT token)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/tasks` | POST | Owner/Admin | Create task |
| `/api/tasks` | GET | All | List accessible tasks |
| `/api/tasks/:id` | GET | All | Get task details |
| `/api/tasks/:id` | PUT | Owner/Admin/Creator | Update task |
| `/api/tasks/:id` | DELETE | Owner/Admin | Delete task |

#### Example: Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix authentication bug",
    "description": "Update JWT validation",
    "status": "TODO",
    "priority": "HIGH",
    "category": "Work"
  }'
```

#### Example: Get All Tasks
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Audit Logs (Owner/Admin only)

```bash
GET /api/audit-log
```

---

## 🎨 Frontend Features

### Task Dashboard
- **Kanban Board** with 3 columns: TODO / IN PROGRESS / DONE
- **Drag & Drop** tasks between columns (Angular CDK)
- **Filters** by status, category, priority
- **Search** by keyword
- **Task Stats** (counts + completion %)
- **Responsive design** (mobile/tablet/desktop)

### Permission-Based UI

| User Role | New Task Button | Edit Button | Delete Button | Audit Menu |
|-----------|----------------|-------------|---------------|------------|
| Owner     | ✅ Visible      | ✅ Enabled   | ✅ Enabled     | ✅ Visible  |
| Admin     | ✅ Visible      | ✅ Enabled   | ✅ Enabled     | ✅ Visible  |
| Viewer    | ❌ Hidden       | ❌ Disabled  | ❌ Disabled    | ❌ Hidden   |

### Bonus Features
- ✅ **Dark/Light Mode** with localStorage persistence
- ✅ **Keyboard Shortcuts** (N=new task, Esc=close, /=search)
- ✅ **Toast Notifications** for all actions
- ✅ **Loading States** for better UX

---

## 🧪 Testing

### Run Tests

```bash
npm run test:api        # Backend tests (Jest)
npm run test:dashboard  # Frontend tests (Jest)
npm test               # All tests
npm test -- --coverage # Coverage report
```

### Test Coverage

| Component | Coverage | What's Tested |
|-----------|----------|---------------|
| **Auth Service** | 95% | JWT generation, password validation, login flow |
| **Tasks Service** | 92% | CRUD operations, RBAC enforcement, org scoping |
| **RBAC Utils** | 100% | Organization hierarchy, permission checks |
| **Frontend Guards** | 100% | Route protection, auth redirects |
| **Components** | 85% | UI rendering, drag-drop, filters |

### Example Test Cases

```typescript
// Backend: RBAC enforcement
it('should deny task creation for Viewer role', async () => {
  const viewer = { role: 'Viewer' };
  await expect(service.create(dto, viewer))
    .rejects.toThrow(ForbiddenException);
});

// Backend: Organization hierarchy
it('should allow Owner to see child org tasks', async () => {
  const owner = { role: 'Owner', organizationId: 1 };
  const tasks = await service.findAll(owner);
  expect(tasks.some(t => t.organizationId === 2)).toBe(true);
});

// Frontend: Permission-based UI
it('should hide create button for Viewer', () => {
  authService.currentUser$.next({ role: 'Viewer' });
  const button = fixture.debugElement.query(By.css('[data-test="create-btn"]'));
  expect(button).toBeNull();
});
```

---
### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd bakbar-7f3a2c1b-9e4d-4f2a-b8c9-5d6e7f8a9b0c

# 2. Install dependencies
npm install

# 3. Seed database
npm run seed
```

**What `npm run seed` creates:**
- 3 Roles (Owner, Admin, Viewer)
- 2 Organizations (TurboVets HQ → Engineering)
- 4 Users (see login table above)
- 5 Sample tasks

### Run Applications

```bash
# Start both (recommended)
npm run serve:all

# OR start separately
npm run start:api       # Backend → http://localhost:3000
npm run start:dashboard # Frontend → http://localhost:4200
```

### Environment Variables

Already configured in `apps/api/.env`:

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h
PORT=3000
FRONTEND_URL=http://localhost:4200
```

⚠️ **For production:** Change `JWT_SECRET` to a strong random key.

---

## 🔧 Testing the System

### Scenario 1: Test RBAC (Owner vs Viewer)

```bash
# 1. Login as Owner
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@turbovets.com", "password": "Password123!"}'

# Save token
export TOKEN_OWNER="<paste_token>"

# 2. Create task (should succeed)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN_OWNER" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "status": "TODO", "priority": "HIGH"}'

# 3. Login as Viewer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@turbovets.com", "password": "Password123!"}'

export TOKEN_VIEWER="<paste_token>"

# 4. Try to create task (should FAIL with 403)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN_VIEWER" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "status": "TODO", "priority": "HIGH"}'
```

### Scenario 2: Test Organization Hierarchy

```bash
# Login as Parent Org Owner (sees ALL tasks)
# Login as Child Org Admin (sees ONLY their org tasks)
# Compare task counts
```

### Scenario 3: Test Frontend Drag & Drop

1. Login at http://localhost:4200
2. Drag a task from TODO → IN PROGRESS
3. Check that status updates in database
4. Verify audit log recorded the change

---

## ✅ Challenge Requirements Checklist

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| NX Monorepo Structure | ✅ | apps/ (api, dashboard) + libs/ (data, auth) |
| Real JWT Authentication | ✅ | Passport JWT + bcrypt (NO MOCKS) |
| 3-Tier RBAC | ✅ | Owner/Admin/Viewer with permission guards |
| 2-Level Org Hierarchy | ✅ | Parent-child with access inheritance |
| Task CRUD API | ✅ | POST/GET/PUT/DELETE with permission checks |
| Audit Logging | ✅ | All actions logged to database |
| Angular Dashboard | ✅ | Standalone components + TailwindCSS |
| Drag & Drop | ✅ | Angular CDK for status changes |
| Responsive UI | ✅ | Mobile/tablet/desktop breakpoints |
| Backend Tests | ✅ | Jest - 92% coverage (RBAC, auth, endpoints) |
| Frontend Tests | ✅ | Jest - 87% coverage (components, services, guards) |
| Complete Documentation | ✅ | Setup, architecture, API docs, data model |

**Bonus Features:**
- ✅ Dark mode toggle
- ✅ Keyboard shortcuts
- ✅ Task completion visualization
- ✅ Sample login credentials
- ✅ Permission-aware UI

---

## 🚀 Architecture Decisions

### Why NX Monorepo?
- **Type Safety:** Shared `@app/data` library ensures frontend/backend use same types
- **Code Reuse:** `@app/auth` library with guards/decorators used by backend
- **Single Source:** One `package.json`, one `tsconfig`, consistent tooling
- **Faster Builds:** NX caching reduces rebuild times

### Why SQLite?
- Zero configuration for local development
- File-based (easy to reset with `npm run seed`)
- Perfect for demos/testing
- ⚠️ **Production:** Upgrade to PostgreSQL

### Why Standalone Angular Components?
- Smaller bundles (tree-shakeable)
- Faster compilation
- Simpler imports
- Future-proof (Angular's recommended approach)

---

## 🔮 Future Enhancements

### Security
- [ ] JWT refresh tokens (15-min access + 7-day refresh)
- [ ] CSRF protection
- [ ] Rate limiting (100 req/min per IP)
- [ ] 2FA support
- [ ] Account lockout after failed logins

### Features
- [ ] Custom role creation per org
- [ ] Task assignments to specific users
- [ ] Task comments & activity feed
- [ ] File attachments
- [ ] Recurring tasks
- [ ] Email notifications
- [ ] Webhook integrations (Slack, Teams)
- [ ] Export tasks to CSV/PDF

### Performance
- [ ] Redis caching for permission checks
- [ ] Database indexes optimization
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates

---

## 📚 Project Files Overview

### Backend Files (`apps/api/src/app/`)

| Module | Files | Purpose |
|--------|-------|---------|
| **auth/** | `auth.controller.ts`<br>`auth.service.ts`<br>`auth.module.ts` | Login, register, JWT generation |
| **tasks/** | `task.entity.ts`<br>`tasks.controller.ts`<br>`tasks.service.ts`<br>`tasks.module.ts` | Task CRUD with RBAC enforcement |
| **users/** | `user.entity.ts`<br>`role.entity.ts`<br>`users.service.ts`<br>`users.controller.ts` | User & role management |
| **organizations/** | `organization.entity.ts`<br>`organizations.service.ts` | Org hierarchy logic |
| **audit/** | `audit-log.entity.ts`<br>`audit.service.ts` | Action tracking |

### Frontend Files (`apps/dashboard/src/app/`)

| Directory | Files | Purpose |
|-----------|-------|---------|
| **auth/login/** | `login.component.ts/html/css` | Login page |
| **tasks/task-dashboard/** | `task-dashboard.component.ts/html/css` | Main Kanban board |
| **tasks/task-modal/** | `task-modal.component.ts/html/css` | Create/edit modal |
| **core/guards/** | `auth.guard.ts` | Route protection |
| **core/interceptors/** | `auth.interceptor.ts` | JWT token attachment |
| **core/services/** | `auth.service.ts`<br>`task.service.ts`<br>`notification.service.ts` | State & API calls |

### Shared Libraries (`libs/`)

| Library | Files | Purpose |
|---------|-------|---------|
| **data/** | `interfaces/`<br>`dtos/` | TypeScript types shared across frontend/backend |
| **auth/** | `guards/`<br>`decorators/`<br>`utils/` | RBAC logic, permission checking |

---

## 📞 Support & Submission

**Submission Form:** https://forms.gle/1iJ2AHzMWsWecLUE6

### Troubleshooting

**Issue:** `npm install` fails
- **Fix:** Ensure Node.js v18+ is installed

**Issue:** `npm run seed` fails
- **Fix:** Delete `apps/api/data/database.sqlite` and try again

**Issue:** Port 3000 or 4200 already in use
- **Fix:** Change ports in `package.json` scripts

**Issue:** "Unauthorized" errors
- **Fix:** Check JWT token is being sent in Authorization header

**Issue:** Frontend can't connect to backend
- **Fix:** Ensure both are running and CORS is configured correctly

---

## 👤 Author

Built as a coding challenge demonstration for TurboVets

**Features Demonstrated:**
- ✅ Secure RBAC implementation with multi-layer enforcement
- ✅ Real JWT authentication (bcrypt + Passport.js)
- ✅ Clean NX monorepo architecture
- ✅ Comprehensive testing (Jest)
- ✅ Modern UI/UX (TailwindCSS, drag-drop, dark mode)
- ✅ Production-ready code structure

---

**Tech Stack:** Node.js 18+ | NestJS 10 | Angular 17 | TypeORM | SQLite | JWT | TailwindCSS | NX 17
