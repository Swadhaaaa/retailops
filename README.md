# Query Management System (QMS)

An enterprise-grade, full-stack ticket and workflow management platform featuring AI-assisted query classification (Groq + Llama 3.1), department-scoped claiming workflows, compliance-checklist ticket resolution, real-time analytics dashboards, and role-based access for users, admins, and departments.

![Python](https://img.shields.io/badge/Python-3.10%2B-4B8BBE?style=flat-square&logo=python&logoColor=white&labelColor=333333)
![Flask](https://img.shields.io/badge/Flask-Backend-00B39F?style=flat-square&logo=flask&logoColor=white&labelColor=333333)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=333333)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=333333)
![DuckDB](https://img.shields.io/badge/DuckDB-Database-FFF000?style=flat-square&logo=duckdb&logoColor=black&labelColor=333333)
![License](https://img.shields.io/badge/License-MIT-DFB317?style=flat-square&labelColor=333333)

---

## Key Highlights

- ⚡ **Multi-Stage Ticket Pipeline**: Combines AI-assisted category suggestion (`Groq` + `llama-3.1-8b-instant`) with department-scoped claim, escalate, and resolve workflows, plus a fallback when the AI service is unavailable.
- 🔐 **Role-Based Access Control**: `JWT`-based authentication with `Bcrypt` password hashing, distinct dashboards, and protected routing for Users, Admins, and Departments.
- ✅ **Compliance-Enforced Resolution**: A 4-point checklist (documents verified, issue investigated, requester updated, final confirmation) must be fully satisfied before any ticket can close.
- 📊 **Live Analytics Dashboards**: `Chart.js`-powered visualizations backed by dedicated stats and announcement endpoints.
- 🗂 **Full Audit Trail**: Every claim, escalation, status change, and resolution is logged in `ticket_activity` for complete traceability.
- 📎 **Attachments & Threaded Comments**: Secure, size- and type-validated file uploads (`werkzeug.secure_filename`) attached to tickets and comment threads.

---

## Why QMS

Large-scale operations handle hundreds of issues daily — invoicing disputes, stock discrepancies, terminal outages, KYC failures. Without a unified system, these get buried in scattered email threads, creating:

- **High triaging overhead** — someone has to manually read and route every issue
- **Zero requester visibility** — no real-time status, leading to duplicate tickets
- **Untracked SLAs** — no way to measure resolution time or department load
- **Compliance gaps** — issues get closed without documented root cause

## 📑 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Database Schema](#-database-schema)
- [Authentication Flow](#-authentication-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

## 🏗 Architecture

QMS is a decoupled three-tier system: a React SPA talks to a Flask REST API, which reads/writes an embedded DuckDB database and calls out to Groq for AI classification.

```
┌────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                        │
│                    React 19 SPA — Vite                         │
│  React Router DOM  │  Axios Client  │  Chart.js  │  Tailwind   │
└───────────────────────────────┬──────────────────────────────┘
                                 │  JSON / HTTP / JWT Bearer Token
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                         │
│                    Flask REST API — Python                     │
│      /api/auth   /api/tickets   /api/users   /api/categories   │
│      Flask-JWT  │  Flask-CORS  │  Flask-Bcrypt  │  Werkzeug    │
└───────────────┬─────────────────────────────┬──────────────────┘
                │ SQL Queries                 │ NLP / AI Calls
                ▼                             ▼
┌───────────────────────────┐   ┌────────────────────────────────┐
│        DATA LAYER         │   │      EXTERNAL AI SERVICE        │
│   DuckDB (tickets.db)     │   │   Groq Cloud API                │
│   15 relational tables    │   │   llama-3.1-8b-instant           │
│   uploads/ (file storage) │   │   AI category suggestions        │
└───────────────────────────┘   └────────────────────────────────┘
```

**Request lifecycle (simplified):** browser → Vite dev server → React renders → Axios attaches JWT → Flask-CORS validates origin → Flask-JWT-Extended decodes token → Blueprint route handler runs → DuckDB query (parameterized) → `jsonify()` response back to the client.

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
| Technology | Version | Role |
|---|---|---|
| Python | 3.10+ | Runtime |
| Flask | latest | Web framework |
| Flask-CORS | latest | Cross-origin handling |
| Flask-JWT-Extended | latest | JWT issuance/verification |
| Flask-Bcrypt | latest | Password hashing |
| DuckDB | latest | Embedded SQL database |
| Groq SDK | latest | LLM client |
| python-dotenv | latest | Env config |
| Werkzeug | latest | WSGI + upload utilities |

</td>
<td valign="top" width="50%">

**Frontend**
| Technology | Version | Role |
|---|---|---|
| React | 19.2.6 | UI framework |
| Vite | 8.0.12 | Build tool / dev server |
| React Router DOM | 7.15.1 | Client-side routing |
| Axios | 1.16.1 | HTTP client |
| Tailwind CSS | 3.4.19 | Styling |
| Chart.js | 4.5.1 | Charting engine |
| react-chartjs-2 | 5.3.1 | React chart bindings |
| TypeScript | 6.0.3 | Type checking |

</td>
</tr>
</table>

## 📂 Folder Structure

```txt
.
├── .vscode/                     # Editor & terminal config
├── backend/
│   ├── app.py                   # Flask bootstrap, CORS, JWT, blueprints
│   ├── database.py               # DuckDB schema + connection factory
│   ├── schema_qms.sql             # Reference SQL schema
│   ├── seed.py                    # Demo data seeder
│   ├── setup_departments.py       # Department setup / role backfill
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/                    # Reserved for future ORM models
│   ├── nlp/
│   │   └── classifier.py          # Groq LLM wrapper
│   ├── routes/
│   │   ├── auth.py                # Login, password reset, current user
│   │   ├── tickets.py              # Core ticket workflow (largest module)
│   │   ├── user.py                 # Admin/agent account management
│   │   └── categories.py           # Category & department mappings
│   └── uploads/                   # Ticket attachment storage
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── App.jsx                 # Route definitions
        ├── main.jsx                 # App entry point
        ├── assets/
        ├── components/               # RaiseTicketModal, AdminTicketDetails, shared/ProtectedRoute, etc.
        ├── context/                  # AuthContext, RoleContext
        ├── pages/                    # LoginPage, UserDashboard, AdminDashboard, DepartmentDashboard
        └── utils/
            └── api.ts                 # Axios client
```

## 🗄 Database Schema

QMS runs on **DuckDB** — an embedded, column-oriented SQL engine. All data lives in a single file (`backend/tickets.db`), so there's zero infrastructure to stand up in development. It supports full SQL (joins, subqueries, window functions) and is fast for dashboard-style analytical queries, but it **does not support concurrent multi-process writes** — a production deployment with multiple workers would need to migrate to PostgreSQL.

**Entity relationships:**

```
roles ──< users >── departments ──< categories ──< tickets
users ──< tickets [raised_by]        users ──< tickets [claimed_by]
tickets ──< ticket_activity, ticket_comments, ticket_attachments,
            ticket_internal_notes, ticket_escalations, ticket_status_history
users ──< notifications
```

**Key tables:**

| Table | Purpose |
|---|---|
| `users` | Accounts — role (`user` \| `admin` \| `super_admin` \| `department`), department, active flag |
| `tickets` | Core ticket record — status, priority, claim state, resolution checklist fields, escalation/reopen counters |
| `ticket_comments` | Communication thread per ticket (supports internal-only notes) |
| `ticket_activity` | Full audit trail of every state change |
| `ticket_attachments` | File references (UUID-prefixed, path-safe) |
| `notifications` | Per-user notification feed |
| `announcements` | System-wide announcements |

Ticket IDs follow the format `MDM000001`; user IDs follow `USR-10001` / `ADM-10001`. Status values: `Open → In Progress → Needs Clarification → Under Review → Resolved → Closed`, with `Withdrawn` and reopen support. Eight indexes cover the common query paths (status/priority/created_at, requester lookups, notification feeds, etc.).

## 🔐 Authentication Flow

1. User selects a role on the login screen and submits credentials
2. Backend verifies the account is active and checks the password with **Bcrypt**
3. On success, a **JWT** is issued embedding identity, role, and department claims
4. The frontend stores the token and redirects to the role-appropriate dashboard
5. Every subsequent request attaches `Authorization: Bearer <token>`; Flask-JWT-Extended validates it per request
6. Logout is a stateless, client-side token removal; a 401 response from any endpoint also triggers automatic logout via an Axios interceptor

> There is no public self-registration — accounts are provisioned by admins via `POST /api/users/admins`.

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API key ([console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
copy .env.example .env           # Windows: copy | macOS/Linux: cp

python database.py
python seed.py
python setup_departments.py
python app.py                    # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # runs on http://localhost:5173
```

### Production Build

```bash
cd frontend
npm run build
```

Running `seed.py` and `setup_departments.py` creates the initial admin and department accounts locally — check those scripts for the accounts they generate.

## 🔐 Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
JWT_SECRET_KEY=change-me-to-a-long-random-secret   # 32+ characters recommended
DB_PATH=tickets.db
GROQ_API_KEY=your-groq-api-key
```

> The active local database is `backend/tickets.db`. A root-level `tickets.db` may also exist as a snapshot/backup — safe to remove if unused.

## 🔌 API Reference

22 endpoints across 4 Flask blueprints.

<details>
<summary><strong>Auth</strong> — 3 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate and receive a JWT |
| POST | `/api/auth/forgot-password` | Request a password reset |
| GET | `/api/auth/me` | Get the current authenticated user |

</details>

<details>
<summary><strong>Categories</strong> — 1 endpoint</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories/` | List categories and department mappings |

</details>

<details>
<summary><strong>Tickets</strong> — 15 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tickets/` | Create a ticket (multipart, supports attachment) |
| GET | `/api/tickets/` | List the current user's tickets |
| GET | `/api/tickets/<ticket_id>` | Get ticket details |
| GET | `/api/tickets/<ticket_id>/activity` | Get the audit trail for a ticket |
| GET | `/api/tickets/admin/all` | Admin/department: list all (scoped) tickets |
| PUT | `/api/tickets/<ticket_id>/user-edit` | Edit a ticket (owner only) |
| POST | `/api/tickets/<ticket_id>/withdraw` | Withdraw a ticket |
| POST | `/api/tickets/<ticket_id>/clarification` | Request or respond to clarification |
| PUT | `/api/tickets/<ticket_id>/assign` | Assign an agent (must match ticket's department) |
| PUT | `/api/tickets/<ticket_id>/status` | Update status |
| PUT | `/api/tickets/<ticket_id>/priority` | Update priority |
| POST | `/api/tickets/<ticket_id>/claim` | Claim an unclaimed ticket (409 if already claimed) |
| POST | `/api/tickets/<ticket_id>/release` | Release a claimed ticket back to the queue |
| POST | `/api/tickets/<ticket_id>/reassign-department` | Escalate to another department |
| POST | `/api/tickets/<ticket_id>/resolve` | Resolve — requires all 4 checklist items to be `true` |
| POST | `/api/tickets/<ticket_id>/reopen` | Reopen a resolved/closed ticket |
| GET | `/api/tickets/download/<filename>` | Download an attachment |
| POST | `/api/tickets/nlp/suggest` | AI category suggestion (Groq, with fallback) |

</details>

<details>
<summary><strong>Department Workflow</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tickets/department/assigned` | Tickets assigned to the caller's department |
| GET | `/api/tickets/departments` | List departments |
| POST | `/api/tickets/<ticket_id>/notes` | Add an internal (agent-only) note |
| GET | `/api/tickets/<ticket_id>/notes` | List internal notes |

</details>

<details>
<summary><strong>Messages & Notifications</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tickets/<ticket_id>/message` | Post a comment/reply (with optional attachment) |
| GET | `/api/tickets/notifications/all` | List notifications |
| PUT | `/api/tickets/notifications/<notif_id>/read` | Mark a notification as read |

> Fully implemented backend; the frontend Messages UI is currently disabled via feature flag.

</details>

<details>
<summary><strong>User & Admin Management</strong> — 6 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/agents` | List department agents |
| GET | `/api/users/admins` | List admins and agents |
| POST | `/api/users/admins` | Create an admin/agent account |
| PUT | `/api/users/admins/<user_id>` | Update an account |
| PUT | `/api/users/admins/<user_id>/status` | Toggle active/inactive |
| DELETE | `/api/users/admins/<user_id>` | Soft-deactivate an account |

</details>

<details>
<summary><strong>Announcements & Stats</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tickets/announcements` | List active announcements |
| GET | `/api/tickets/stats` | Dashboard statistics |

</details>
