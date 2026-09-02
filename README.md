# Pulse — Notifications System

A full-stack personal notifications dashboard. Authenticated users can create,
view, edit and delete notifications categorised as `INFO`, `WARNING` or `ERROR`.
Recent notifications surface as dismissible banners on the dashboard.

- **Backend:** NestJS + MongoDB (Mongoose), JWT auth, bcrypt password hashing
- **Frontend:** React + TypeScript (Vite), React Router, axios

> Setup instructions, environment variables and project structure are documented
> below. This README is filled in as the project is built.

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a connection string to a hosted instance)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your values
npm run start:dev
```

## Environment variables

See `backend/.env.example` for the full list with descriptions.

| Variable         | Description                                  |
| ---------------- | -------------------------------------------- |
| `MONGO_URI`      | MongoDB connection string                    |
| `JWT_SECRET`     | Secret used to sign JWTs                     |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1d`)                   |
| `PORT`           | Port the API listens on                      |
| `CORS_ORIGIN`    | Origin allowed to call the API               |

## Running tests

```bash
cd backend
npm test
```
