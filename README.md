# QueryFlow – Retail Query Management System

<p align="center">
  A full-stack ticket and workflow platform for managing retail queries from creation through resolution.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/Flask-Backend-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask backend" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/DuckDB-Database-FFF000?style=flat-square&logo=duckdb&logoColor=black" alt="DuckDB database" />
  <img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel frontend" />
  <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render backend" />
</p>

---

## Key Highlights

- ⚡ **End-to-end ticket workflow** — create, assign, claim, clarify, escalate, resolve, reopen, and track tickets.
- 🔐 **Role-based access** — JWT-secured dashboards and workflows for Users, Admins, and Department users.
- ✅ **Resolution checklist** — resolution requires completion of the implemented compliance checklist.
- 📊 **Operational visibility** — dashboard statistics, announcements, notifications, activity history, and Chart.js analytics.
- 🤖 **AI-assisted categorization** — Groq-powered category suggestions with an application fallback.
- 🗂️ **Traceability and attachments** — ticket activity records, internal notes, messages, and file attachments.

## Quick Start / Try the Live Demo

- **Frontend (Vercel):** <https://query-flow-ruby.vercel.app>
- **Backend (Render):** <https://queryflow-backend-0gr7.onrender.com>

Opening the backend URL returns the QMS Retail API health response.

## Demo Credentials

| Account | Email | Password | User ID | Role |
|---|---|---|---|---|
| Admin | `admin@test.com` | `Admin@123` | `USR-10001` | `admin` |
| User | `user1@test.com` | `User@123` | `USR-10002` | `user` |
| User | `user2@test.com` | `User@123` | `USR-10003` | `user` |
| Vendor/User | `abc@test.com` | `User@123` | `USR-10004` | `user` |

> These are demo/test credentials intended only for testing the deployed application. Do not use these credentials for any real or sensitive data.

The User ID is an identifier, not the login credential. Use the email and password to sign in.

## Features

- JWT authentication and bcrypt password hashing, with User, Admin, and Department roles.
- Protected role-specific dashboards.
- Ticket creation, attachments, activity history, comments, clarification, withdrawal, resolution, and reopening.
- Ticket assignment, priority/status updates, department claiming/releasing, reassignment, and internal notes.
- Category-to-department mapping, notifications, announcements, dashboard statistics, and Chart.js analytics.
- Groq-assisted category suggestions with a fallback when unavailable.
- Admin and department account management, plus password reset for active accounts.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, TypeScript, Axios, Tailwind CSS, Chart.js |
| Backend | Python, Flask, Flask-CORS, Flask-JWT-Extended, Flask-Bcrypt, Werkzeug |
| Database | DuckDB |
| AI | Groq Python SDK |
| Deployment | Vercel (frontend), Render (backend) |

## Architecture

```text
User / Admin / Department User
            |
            v
React + Vite frontend (Vercel)
            |
            | HTTPS + JWT bearer token
            v
Flask REST API (Render)
            |
            +--> DuckDB database and upload storage
            +--> Groq API category suggestions
```

## How to Test

1. Open the frontend URL and select a role.
2. Sign in with one of the demo accounts.
3. As a User, create a ticket (optionally with an attachment).
4. Sign in as the Admin and find the ticket in the admin queue.
5. Test the available assignment, priority, and status actions.
6. To test department workflow, use a seeded department account such as `finance@relianceretail.com` / `password123`; claim or release a ticket, add an internal note, reassign it, or resolve it.
7. Refresh and confirm the ticket activity persists.

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- Groq API key for AI category suggestions

### Backend

```bash
git clone https://github.com/Swadhaaaa/retailops.git
cd retailops/backend
python -m venv venv
```

Activate the environment (`.\venv\Scripts\Activate.ps1` on Windows PowerShell or `source venv/bin/activate` on macOS/Linux), then run:

```bash
pip install -r requirements.txt
copy .env.example .env
python database.py
python seed.py
python setup_departments.py
python app.py
```

On macOS/Linux, use `cp .env.example .env`. The API runs at `http://localhost:5000`.

### Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Then start Vite:

```bash
npm run dev
```

The frontend normally runs at `http://localhost:5173`. Use `npm run build` for a production build.

## Environment Variables

Backend values belong in `backend/.env`:

| Variable | Purpose |
|---|---|
| `JWT_SECRET_KEY` | Secret used to sign JWT access tokens. |
| `DB_PATH` | DuckDB path; defaults to `tickets.db`. |
| `GROQ_API_KEY` | Groq API key for category suggestions. |

Frontend builds require `VITE_API_URL`, the Flask API base URL including `/api`.

Never commit real `.env` values, API keys, or JWT secrets.

## API Overview

The API base is the Render URL above. All routes require a JWT unless stated otherwise.

| Group | Routes | Access |
|---|---|---|
| `/api/auth` | `POST /login`, `POST /forgot-password`, `GET /me` | Login/reset are public; `/me` requires JWT. |
| `/api/categories` | `GET /` | Public list of active categories and departments. |
| `/api/tickets` | Create/list tickets; ticket details, edits, withdrawal, clarification, history, assignments, priority/status, department queues, claim/release, notes, reassignment, resolve/reopen, attachments, messages, notifications, announcements, stats, and AI suggestions. | JWT required. Role and department checks apply to protected actions. |
| `/api/users` | `GET /agents`; `GET/POST /admins`; `PUT/DELETE /admins/<user_id>`; `PUT /admins/<user_id>/status` | JWT required; admin management is admin-only. |

Important ticket endpoints include:

```text
POST/GET  /api/tickets/
GET       /api/tickets/<ticket_id>
GET       /api/tickets/admin/all
PUT       /api/tickets/<ticket_id>/assign
PUT       /api/tickets/<ticket_id>/status
PUT       /api/tickets/<ticket_id>/priority
POST      /api/tickets/<ticket_id>/claim
POST      /api/tickets/<ticket_id>/release
POST/GET  /api/tickets/<ticket_id>/notes
POST      /api/tickets/<ticket_id>/resolve
POST      /api/tickets/<ticket_id>/reopen
```

See `backend/routes/` for the complete request validation and authorization behavior.

## Database

QueryFlow uses DuckDB. `database.py` initializes or updates the schema; `seed.py` inserts demo users, categories, announcements, and sample data; `setup_departments.py` configures department mappings and department test accounts.

DuckDB is suitable for development and a single-instance demo but does not support concurrent multi-process writes. The deployed backend needs persistent storage for `tickets.db` and `uploads/`; production-scale use should migrate to PostgreSQL and object storage.

## Deployment

The frontend is deployed on Vercel and the Flask API on Render. `VITE_API_URL` connects the Vercel build to `https://queryflow-backend-0gr7.onrender.com/api`.

### Vercel

```text
Framework: Vite
Root directory: frontend
Build command: npm run build
Output directory: dist
```

Set `VITE_API_URL=https://queryflow-backend-0gr7.onrender.com/api` for Production and Preview. Add a `frontend/vercel.json` rewrite to `index.html` for React Router refresh support.

### Render

```text
Root directory: backend
Build command: pip install -r requirements.txt gunicorn
Start command: gunicorn app:app --bind 0.0.0.0:$PORT
```

Set backend variables in Render and configure persistent storage. Future GitHub pushes can trigger connected Vercel and Render deployments.

## Project Structure

```text
backend/
├── app.py                    # Flask application and blueprints
├── database.py               # DuckDB schema and connection
├── seed.py                   # Demo data
├── setup_departments.py      # Department setup
├── routes/                   # auth, categories, tickets, user routes
└── nlp/classifier.py         # Groq integration
frontend/
├── src/pages/                # User, Admin, Department dashboards
├── src/components/           # UI components
├── src/context/              # Auth and role state
├── src/utils/api.ts          # Axios API client
├── package.json
└── vite.config.js
```

## Security Notes

- Use environment variables for secrets and do not commit `.env` files.
- Demo credentials are for testing only.
- Use a strong, unique `JWT_SECRET_KEY` and real user credentials in production.
- Restrict CORS to the deployed frontend domain and add verification to the password-reset flow before public production use.

## Future Improvements

- Migrate to PostgreSQL and object storage.
- Add verified email password resets and notifications.
- Add automated tests, CI, monitoring, and audit-log export.

## License

No license is currently specified for this repository.
