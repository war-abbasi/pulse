# Pulse — Notifications System

A full-stack personal notifications dashboard. Authenticated users create, view,
edit and delete notifications categorised as `INFO`, `WARNING` or `ERROR`. Recent
undismissed notifications surface as dismissible banners at the top of the
dashboard, and new ones appear immediately without a page reload.

Built with **React + TypeScript** on the front end and **NestJS + MongoDB** on the
back end, as a re-implementation of an existing Angular 7 / Express application.

---

## Prerequisites

| Requirement | Version | Notes                                                     |
| ----------- | ------- | --------------------------------------------------------- |
| Node.js     | 20+     | Developed on Node 24.                                     |
| npm         | 10+     | Ships with Node.                                          |
| MongoDB     | 6+      | A local instance on the default port is fine.             |

Check MongoDB is reachable before starting the API:

```bash
curl -s --max-time 3 http://127.0.0.1:27017 && echo "MongoDB is up"
```

---

## Setup

The backend and frontend are separate applications and each needs its own install.

### 1. Backend

```bash
cd backend && npm install && cp .env.example .env
```

Edit `backend/.env` and set at minimum a `MONGO_URI` and a `JWT_SECRET`.

### 2. Frontend

```bash
cd frontend && npm install && cp .env.example .env
```

The default `VITE_API_URL` already points at the backend's default port.

---

## Environment variables

### `backend/.env`

| Variable         | Required | Example                                        | Description                                                                 |
| ---------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `MONGO_URI`      | yes      | `mongodb://127.0.0.1:27017/pulse-notifications` | MongoDB connection string. The app refuses to boot without it.               |
| `JWT_SECRET`     | yes      | `a-long-random-string`                          | Secret used to sign and verify JWTs. Use a long random value in production.  |
| `JWT_EXPIRES_IN` | no       | `1d`                                            | Token lifetime (`60s`, `15m`, `1d`). Defaults to `1d`.                       |
| `PORT`           | no       | `3000`                                          | Port the API listens on. Defaults to `3000`.                                 |
| `CORS_ORIGIN`    | yes      | `http://localhost:5173`                         | The single origin allowed to call the API.                                   |

### `frontend/.env`

| Variable       | Required | Example                 | Description                  |
| -------------- | -------- | ----------------------- | ---------------------------- |
| `VITE_API_URL` | no       | `http://localhost:3000` | Base URL of the NestJS API.  |

`.env` files are gitignored. `.env.example` in each folder documents the full set.

---

## Running the app

Two terminals — the backend must be running before the frontend is useful.

**Terminal 1 — API on `http://localhost:3000`:**

```bash
cd backend && npm run start:dev
```

**Terminal 2 — web app on `http://localhost:5173`:**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`, register an account, and you are on the dashboard.

---

## Running tests

```bash
cd backend && npm test
```

21 unit tests across the three services, using mocked Mongoose models — no
database is required to run them.

```bash
cd backend && npm run test:cov
```

---

## Project structure

```
.
├── backend/                        NestJS API
│   └── src/
│       ├── auth/                   JWT auth: strategy, guard, login/register
│       │   ├── decorators/         @CurrentUser — reads the verified identity
│       │   ├── guards/             JwtAuthGuard
│       │   └── strategies/         passport-jwt token verification
│       ├── users/                  User schema, bcrypt hashing, public mapper
│       ├── notifications/          Notification CRUD, owner-scoped queries
│       ├── common/pipes/           ParseObjectIdPipe
│       └── app.module.ts           Config, Mongoose connection, feature modules
│
└── frontend/                       React SPA
    └── src/
        ├── components/
        │   ├── ui/                 Button, form fields, alert, logo
        │   ├── layout/             Navbar, page shell, theme toggle
        │   └── notifications/      Banners, cards, the shared form
        ├── context/                Auth, notifications and theme providers
        ├── hooks/                  useAuth, useNotifications, useAutoDismissInfo
        ├── pages/                  One component per route
        ├── services/               axios instance and API calls
        ├── lib/                    Validation rules, category styles, helpers
        └── types/                  Shared domain types
```

---

## API

All `/notifications` routes require `Authorization: Bearer <token>`.

| Method            | Path                 | Success | Description                                     |
| ----------------- | -------------------- | ------- | ----------------------------------------------- |
| `POST`            | `/auth/register`     | 201     | Create an account and receive a token.          |
| `POST`            | `/auth/login`        | 200     | Exchange credentials for a token.               |
| `GET`             | `/auth/me`           | 200     | Confirm the current token is still valid.       |
| `GET`             | `/notifications`     | 200     | The caller's notifications, newest first.       |
| `GET`             | `/notifications/:id` | 200     | A single notification the caller owns.          |
| `POST`            | `/notifications`     | 201     | Create a notification.                          |
| `PATCH` / `PUT`   | `/notifications/:id` | 200     | Update any subset of fields.                    |
| `DELETE`          | `/notifications/:id` | 204     | Delete a notification.                          |

Errors: `400` failed validation or a malformed id, `401` missing/invalid token or
bad credentials, `404` the notification does not exist **or does not belong to the
caller**, `409` username already taken.

`PATCH` is the primary update verb because every field is optional and dismissing a
banner sends only `{ "isClosed": true }`. `PUT` is accepted as an alias.

---

## Design decisions

**State management — React Context.** The notification list lives in a context
above the router, not inside the dashboard. Create and edit are separate routes, so
page-local state would be discarded and refetched on every navigation. Context lets
a create prepend to the shared array and have the dashboard render it immediately.
At this scale Redux would add machinery without solving a problem Context does not
already solve.

**Schema types.** `timestamps: true` gives real `Date` values with `createdAt` and
`updatedAt`, rather than the original's `date: number`. They sort correctly in the
database, are readable when inspecting documents, and are indexable — a compound
index on `{ userId: 1, createdAt: -1 }` matches the only list query the app makes.

**Category as a string enum.** Values survive serialisation and are legible in the
database. The original used a bare numeric enum, which is why its
`category.toString() === 'INFO'` check silently never matched.

**Auto-dismiss timing.** The 90-second countdown for `INFO` starts when a
notification first becomes visible in the session rather than from its creation
date, so opening the dashboard does not instantly clear every older INFO item.

---

## Improvements over the original

The original Angular/Express implementation was studied for its requirements, not
copied. These are the specific problems it had and how this version addresses them.

| Original behaviour                                                        | This implementation                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `findOne(req.body)` used the request body as the Mongo query, so `{"Password":{"$ne":null}}` logged you in as anyone | Credentials are typed `@IsString()` and stripped by a global whitelist; the lookup is by username only and the password is checked with `bcrypt.compare` |
| Login returned the full user document, password hash included             | The hash is `select: false` and responses go through an explicit public mapper    |
| MD5 hashing, performed in the browser — the hash *was* the password        | bcrypt at cost 12, server-side only; plaintext never leaves the request           |
| The entire user object, hash and all, stored in a browser cookie          | Only the JWT and a public profile are persisted                                   |
| Notification routes took `:userId` from the URL with no authentication    | The user id comes from the verified JWT and cannot be chosen by the caller        |
| Any caller could read, edit or delete any notification by id (IDOR)       | Every query is scoped `{ _id, userId }`; a foreign id returns 404                 |
| `insertOne(req.body)` stored whatever the client sent (mass assignment)   | `whitelist` + `forbidNonWhitelisted` reject undeclared properties with a 400      |
| No validation — a one-character password was accepted                     | class-validator DTOs on every endpoint, mirrored by client-side validation        |
| Failed logins returned `200 OK` with an empty body                        | `401` with a message identical to "unknown user", so usernames cannot be enumerated |
| Duplicate usernames prevented by check-then-insert, open to a race        | A unique index enforces it atomically; error 11000 becomes a `409`                |
| A malformed id crashed the query and surfaced as a 500                    | `ParseObjectIdPipe` returns a `400`                                               |
| `filter(...)[0] = notification` assigned into a throwaway array, so edits never appeared | Updates map to a new array, which is also what React needs to re-render   |
