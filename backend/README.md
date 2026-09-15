# Backend API

Self-contained Express + PostgreSQL server. It does not share dependencies with the React Native app in the repo root.

## 1. Create the database

1. Open **pgAdmin**.
2. Create a database (for example `todo_app`).
3. Open the Query Tool for that database.
4. Open `schema.sql` from this folder, paste/run it, and execute.
5. Confirm the tables exist: `users`, `lists`, `tasks`, `subtasks`, `dhikr_logs`, `streaks`.

Insert at least one user before creating lists or tasks:

```sql
INSERT INTO users (name) VALUES ('Demo User') RETURNING id;
```

## 2. Configure environment variables

```bash
cd backend
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Edit `.env` with your PostgreSQL host, port, database name, user, and password.

## 3. Install and start

```bash
cd backend
npm install
npm start
```

The API listens on `http://localhost:3000` (or `PORT` from `.env`).

Check: `GET http://localhost:3000/health` → `{ "ok": true }`.

## Endpoints

Tasks (optional `?user_id=` on GET):

| Method | Path | Body |
| --- | --- | --- |
| GET | `/tasks` | — |
| POST | `/tasks` | `{ "user_id", "text", "list_id?", "completed?", "priority?", "category?", "due_date?" }` |
| PUT | `/tasks/:id` | any task fields to update |
| DELETE | `/tasks/:id` | — |

Lists:

| Method | Path | Body |
| --- | --- | --- |
| GET | `/lists` | optional `?user_id=` |
| POST | `/lists` | `{ "user_id", "name" }` |
| DELETE | `/lists/:id` | — |

`priority` must be `high`, `medium`, or `low`.
