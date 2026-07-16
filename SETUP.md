# Setup Guide

## Backend Setup

From the project root:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

Windows PowerShell:

```bash
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the backend environment file:

```bash
copy .env.example .env
```

Initialize the database:

```bash
python database.py
```

Seed demo data:

```bash
python seed.py
```

Run the backend:

```bash
python app.py
```

The backend runs on:

```txt
http://localhost:5000
```

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server usually runs on:

```txt
http://localhost:5173
```

Build the frontend:

```bash
npm run build
```

## How To Configure `.env`

Create `backend/.env` from `backend/.env.example`:

```env
JWT_SECRET_KEY=change-me-to-a-long-random-secret
DB_PATH=tickets.db
GROQ_API_KEY=your-groq-api-key
```

Recommended notes:
- Use a long random value for `JWT_SECRET_KEY`.
- Keep `DB_PATH=tickets.db` for the current local setup unless you intentionally want another DuckDB file.
- Do not expose real `.env` values in screenshots, commits, or shared reports.

## Groq API Key Setup

The backend uses Groq for AI-assisted ticket category suggestions.

Steps:
1. Create or use an existing Groq account.
2. Generate an API key from the Groq dashboard.
3. Put the key in `backend/.env`:

```env
GROQ_API_KEY=your-groq-api-key
```

If the key is missing or the request fails, the classifier catches the error and falls back to a default category.

## DuckDB Notes

- DuckDB is used as the local database.
- The default database path is `tickets.db`.
- `backend/database.py` creates tables if they do not already exist.
- `backend/seed.py` clears and inserts demo users, categories, and announcements.
- Uploaded files are stored in `backend/uploads`.

## Common Issues

Backend import errors:
- Ensure the virtual environment is activated.
- Run `pip install -r requirements.txt` from the `backend` folder.

JWT errors:
- Ensure `JWT_SECRET_KEY` exists in `backend/.env`.

Groq errors:
- Ensure `GROQ_API_KEY` exists in `backend/.env`.
- If Groq is unavailable, category suggestion may fall back to a default category.

Database not found or empty:
- Run `python database.py`.
- Run `python seed.py` if demo users/categories are needed.

Frontend cannot reach backend:
- Ensure the backend is running on `http://localhost:5000`.
- The frontend API base URL is currently hardcoded to `http://localhost:5000/api`.

Login fails:
- Make sure seed data has been inserted.
- Confirm you are using the seeded demo credentials or updated credentials.

File upload/download issues:
- Confirm `backend/uploads` exists.
- The backend creates this folder automatically when the tickets route module loads.
