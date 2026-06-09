# Query Management System

## Project Overview

Query Management System is a full-stack ticket and query management application for handling user-raised support issues, admin workflows, ticket assignment, status updates, messaging, attachments, notifications, analytics, department visibility, and AI-assisted category suggestions.

The backend is a Flask API backed by DuckDB. The frontend is a Vite React dashboard with separate user and admin experiences.

## Tech Stack

Backend:
- Python
- Flask
- Flask-CORS
- Flask-JWT-Extended
- Flask-Bcrypt
- DuckDB
- Groq API
- python-dotenv

Frontend:
- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Chart.js
- react-chartjs-2

## Features

- User login with JWT authentication
- Role-based protected routing
- User ticket creation with optional attachment upload
- AI-assisted ticket category suggestion using Groq
- User ticket dashboard
- Admin dashboard with ticket overview
- Admin query management
- Ticket status, priority, and assignment updates
- Admin and user messaging on tickets
- File attachment download support
- Notifications
- Announcements API
- Dashboard analytics with Chart.js
- Department performance view
- Admin management view

## Folder Structure

```txt
.
├── backend
│   ├── app.py
│   ├── database.py
│   ├── seed.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── models
│   ├── nlp
│   ├── routes
│   └── uploads
├── frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── utils
│   │   └── assets
│   └── public
├── README.md
└── SETUP.md
```

## Implemented APIs Summary

Base:
- `GET /`

Auth:
- `POST /api/auth/login`
- `GET /api/auth/me`

Categories:
- `GET /api/categories/`

Tickets:
- `POST /api/tickets/`
- `GET /api/tickets/`
- `GET /api/tickets/<ticket_id>`
- `GET /api/tickets/admin/all`
- `PUT /api/tickets/<ticket_id>/assign`
- `PUT /api/tickets/<ticket_id>/status`
- `PUT /api/tickets/<ticket_id>/priority`
- `POST /api/tickets/<ticket_id>/ping`
- `POST /api/tickets/<ticket_id>/message`
- `GET /api/tickets/download/<filename>`
- `POST /api/tickets/nlp/suggest`

Notifications, announcements, and stats:
- `GET /api/tickets/notifications/all`
- `PUT /api/tickets/notifications/<notif_id>/read`
- `GET /api/tickets/announcements`
- `GET /api/tickets/stats`

## Demo Credentials Placeholder

Admin:
- Email: `admin@test.com`
- Password: `Admin@123`

User:
- Email: `user1@test.com`
- Password: `User@123`

Update these credentials if seed data changes.

