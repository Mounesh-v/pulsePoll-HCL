# 🗳️ PulsePoll

> **Real-time polling platform** — Create, share, and watch votes roll in live.

PulsePoll is a full-stack web application that lets authenticated users create polls and share them publicly. Voters participate without signing up and results update in real time via WebSocket connections powered by a Redis Pub/Sub fan-out layer.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Models](#data-models)
- [Application Flow](#application-flow)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Guide](#development-guide)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | JWT-based register / login for poll creators |
| 📊 **Poll Management** | Create multi-option polls with optional expiry |
| 🌍 **Public Voting** | Anyone with a link can vote — no account needed |
| ⚡ **Live Results** | WebSocket push keeps every viewer in sync |
| 🚫 **Duplicate Prevention** | Anonymous voter tokens stored in a secure browser cookie |
| 🔒 **Close Polls** | Owners can lock a poll to stop further votes |
| 📈 **Charts** | Interactive bar/pie charts via Recharts |

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Go 1.27 |
| HTTP Framework | [Gin](https://github.com/gin-gonic/gin) v1.12 |
| Database | MongoDB 7 (via official Go driver v2) |
| Cache / Pub-Sub | Redis 7 (via `go-redis/v9`) |
| WebSocket | [Gorilla WebSocket](https://github.com/gorilla/websocket) v1.5 |
| Auth | JWT (RS256) — `golang-jwt/jwt v5` |
| Password Hashing | bcrypt — `golang.org/x/crypto` |
| Config | `.env` via `godotenv` |

### Frontend
| Layer | Technology |
|---|---|
| Language | JavaScript (ES Modules) |
| Framework | React 19 |
| Routing | React Router DOM v7 |
| HTTP Client | Axios v1 |
| Charts | Recharts v3 |
| Animations | GSAP v3 |
| Icons | Lucide React |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite v8 |

### Infrastructure
| Component | Technology |
|---|---|
| Local Dev DBs | Docker Compose (MongoDB + Redis) |
| Containerisation | Docker-ready (compose file provided) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   React SPA (Vite)                                              │
│   ┌───────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│   │  Auth     │  │  Poll Pages  │  │  Live Results Page     │  │
│   │  Context  │  │  Dashboard   │  │  useWebSocket hook     │  │
│   └───────────┘  └──────────────┘  └──────────┬─────────────┘  │
│         │               │                     │                 │
│         └──── Axios ────┘           WebSocket (ws://)           │
└─────────────────────┬───────────────────────┬───────────────────┘
                      │ HTTP/REST             │ WebSocket
                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Go / Gin HTTP Server                        │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐  │
│  │  Auth      │  │  Poll      │  │  Vote     │  │  WS      │  │
│  │  Handler   │  │  Handler   │  │  Handler  │  │  Handler │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  └────┬─────┘  │
│        │               │               │              │         │
│        └───────────────┴───────────────┘              │         │
│                        │                              │         │
│               ┌────────▼────────┐           ┌─────────▼──────┐ │
│               │    Services     │           │  Realtime Hub  │ │
│               │  (business      │           │  (goroutine    │ │
│               │   logic)        │           │   per poll)    │ │
│               └────────┬────────┘           └─────────┬──────┘ │
│                        │                              │         │
│               ┌────────▼────────┐           ┌─────────▼──────┐ │
│               │  Repositories   │           │ Redis Pub/Sub  │ │
│               │  (data access)  │           │  Subscriber    │ │
│               └────────┬────────┘           └────────────────┘ │
└────────────────────────┼────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        ┌─────▼──────┐      ┌───────▼──────┐
        │  MongoDB   │      │    Redis     │
        │  (persist) │      │  (pub/sub +  │
        │            │      │   vote cache)│
        └────────────┘      └──────────────┘
```

### Real-Time Fan-Out Detail

```
Vote HTTP POST
     │
     ▼
VoteService.SubmitVote()
     │
     ├─── Write Vote doc ──► MongoDB (votes collection)
     │
     └─── PUBLISH "poll:<id>" ──► Redis Pub/Sub channel
                                        │
                              Redis Subscriber goroutine
                                        │
                                   Hub.Broadcast
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                    WS Client A                 WS Client B
                  (browser tab 1)             (browser tab 2)
```

---

## Data Models

### `User`
```go
type User struct {
    ID           bson.ObjectID  // MongoDB primary key
    Name         string
    Email        string         // unique index
    PasswordHash string         // bcrypt hash — never serialised to JSON
    CreatedAt    time.Time
}
```

### `Poll`
```go
type Poll struct {
    ID        bson.ObjectID   // MongoDB primary key
    CreatorID bson.ObjectID   // references User._id
    Question  string
    Options   []PollOption    // { id: uuid-string, text: string }
    Status    string          // "active" | "closed"
    ExpiresAt *time.Time      // optional — null means no expiry
    CreatedAt time.Time
}
```

### `Vote`
```go
type Vote struct {
    ID         bson.ObjectID  // MongoDB primary key
    PollID     bson.ObjectID  // references Poll._id
    OptionID   string         // references PollOption.id
    VoterToken string         // anonymous cookie token — never serialised to JSON
    CreatedAt  time.Time
}
```

> **Voter Token** — An anonymous, random string issued as a secure browser cookie. It prevents double-voting within the same browser session but is **not** a full identity guarantee (see [Known Limitations](#known-limitations)).

---

## Application Flow

### 1 — User Registration & Login

```
Browser                 Backend             MongoDB
  │                        │                   │
  │── POST /api/auth/register ──►              │
  │   { name, email, password }               │
  │                        │── hash password  │
  │                        │── insert user ──►│
  │                        │◄─ user doc ───── │
  │◄── 201 { token, user } ─┤
  │   (token stored in localStorage)
```

### 2 — Create a Poll

```
Browser (authenticated)       Backend            MongoDB
  │                              │                  │
  │── POST /api/polls ──────────►│                  │
  │   Bearer <JWT>               │── verify JWT     │
  │   { question, options,       │── insert poll ──►│
  │     expiresAt? }             │◄─ poll doc ───── │
  │◄── 201 { poll } ────────────-│
```

### 3 — Vote (anonymous)

```
Browser (any visitor)           Backend      MongoDB      Redis
  │                                │            │           │
  │── POST /api/polls/:id/vote ───►│            │           │
  │   Cookie: voter_token=<tok>    │            │           │
  │   { optionId }                 │            │           │
  │                                │── check duplicate ───►│
  │                                │   (voter_token + poll)│
  │                                │── insert vote ───────►│
  │                                │── PUBLISH "poll:<id>" ►│
  │◄── 200 { message } ───────────-│
```

### 4 — Live Results (WebSocket)

```
Browser                 Backend (Hub)        Redis Subscriber
  │                          │                      │
  │── GET /ws/polls/:id ────►│                      │
  │   (WebSocket upgrade)    │── register client    │
  │                          │                      │
  │             ┌────── Vote submitted elsewhere     │
  │             │            │◄── PUBLISH "poll:<id>"┤
  │             │            │── Broadcast payload  │
  │◄─ WS frame { results } ──┤
  │   (chart auto-updates)   │
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login and receive JWT |

### Polls

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/polls` | ✅ Bearer | Create a new poll |
| `GET` | `/api/polls` | ✅ Bearer | List the caller's polls |
| `GET` | `/api/polls/:id` | — | Fetch a single poll (public) |
| `PATCH` | `/api/polls/:id/close` | ✅ Bearer | Close a poll |

### Voting & Results

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/polls/:id/vote` | — | Submit a vote (cookie-based dedup) |
| `GET` | `/api/polls/:id/results` | — | Fetch current vote tallies |

### Real-Time

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws/polls/:id` | Stream live result updates |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service + DB connectivity check |

---

## Project Structure

```
pulsepoll/
├── backend/                        # Go API server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go             # Entry point — wires everything together
│   ├── config/
│   │   └── config.go               # Env-var loader (godotenv)
│   ├── internal/
│   │   ├── database/
│   │   │   ├── mongodb.go          # MongoDB connection helper
│   │   │   └── redis.go            # Redis connection helper
│   │   ├── handlers/
│   │   │   ├── auth_handler.go     # POST /api/auth/*
│   │   │   ├── poll_handler.go     # CRUD poll endpoints
│   │   │   ├── vote_handler.go     # POST /api/polls/:id/vote
│   │   │   ├── result_handler.go   # GET  /api/polls/:id/results
│   │   │   └── websocket_handler.go# WS  /ws/polls/:id
│   │   ├── middleware/
│   │   │   └── auth.go             # JWT validation middleware
│   │   ├── models/
│   │   │   ├── user.go             # User document schema
│   │   │   ├── poll.go             # Poll + PollOption schema
│   │   │   └── vote.go             # Vote document schema
│   │   ├── realtime/
│   │   │   ├── hub.go              # In-process WS client registry & broadcaster
│   │   │   └── redis_subscriber.go # Bridges Redis Pub/Sub → Hub
│   │   ├── repositories/
│   │   │   ├── user_repository.go  # MongoDB CRUD for users
│   │   │   ├── poll_repository.go  # MongoDB CRUD for polls
│   │   │   └── vote_repository.go  # MongoDB CRUD + tally for votes
│   │   ├── routes/
│   │   │   └── routes.go           # Route registration (DI wiring)
│   │   └── services/
│   │       ├── auth_service.go     # Register, login, JWT signing
│   │       ├── poll_service.go     # Poll business logic
│   │       └── vote_service.go     # Vote dedup, persist, publish
│   ├── .env.example                # Environment variable template
│   ├── docker-compose.yml          # Local MongoDB + Redis
│   └── go.mod / go.sum
│
└── frontend/                       # React SPA (Vite)
    ├── public/                     # Static assets
    ├── src/
    │   ├── assets/                 # Images / SVGs
    │   ├── components/
    │   │   ├── Navbar.jsx          # Top navigation bar
    │   │   ├── PollCard.jsx        # Poll summary card (dashboard list)
    │   │   ├── ProtectedRoute.jsx  # Route guard for authenticated pages
    │   │   ├── ResultChart.jsx     # Recharts bar / result visualisation
    │   │   └── hero/               # Landing page hero components
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Global auth state (React Context)
    │   │   └── useAuth.js          # useAuth() convenience hook
    │   ├── hooks/
    │   │   └── useWebSocket.js     # WebSocket connection + message handler
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx # Shared sidebar / header for auth pages
    │   ├── pages/
    │   │   ├── Landing.jsx         # Public marketing / hero page
    │   │   ├── Login.jsx           # Login form
    │   │   ├── Register.jsx        # Registration form
    │   │   ├── Dashboard.jsx       # Creator's poll list
    │   │   ├── CreatePoll.jsx      # New poll form
    │   │   └── PollDetails.jsx     # Public vote + live results page
    │   ├── services/
    │   │   └── api.js              # Axios instance + all API helpers
    │   ├── App.jsx                 # Route declarations
    │   └── main.jsx                # React root mount
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Go | ≥ 1.21 |
| Node.js | ≥ 20 |
| Docker & Docker Compose | any recent |

### 1 — Start backing services

```bash
cd backend
docker compose up -d
```

This starts **MongoDB** on `27017` and **Redis** on `6379`.

### 2 — Configure the backend

```bash
cp .env.example .env
```

Edit `.env` and fill in your values (see [Environment Variables](#environment-variables)).

### 3 — Run the backend

```bash
cd backend
go run ./cmd/server
# Server starts on http://localhost:8080
```

### 4 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

> The Vite dev server proxies `/api` and `/ws` to the Go backend automatically (see `vite.config.js`).

---

## Environment Variables

Create `backend/.env` based on `backend/.env.example`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8080` | HTTP listen port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `MONGODB_DATABASE` | **Yes** | — | Database name |
| `REDIS_ADDR` | **Yes** | — | Redis host:port (e.g. `localhost:6379`) |
| `REDIS_PASSWORD` | No | `""` | Redis AUTH password |
| `REDIS_DB` | No | `0` | Redis logical DB index |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWTs (min 32 chars recommended) |
| `FRONTEND_ORIGIN` | **Yes** | — | CORS allowed origin (e.g. `http://localhost:5173`) |

---

## Development Guide

### Backend Conventions

- **Package layout** follows the [Standard Go Project Layout](https://github.com/golang-standards/project-layout).
- Business logic lives in `internal/services/` — handlers only parse requests and delegate.
- Repositories are the **only** layer that touches the database drivers.
- All MongoDB operations use the official driver v2 (context-first API).
- Errors are wrapped with context before returning up the call stack.

### Frontend Conventions

- State that crosses multiple components lives in `context/`.
- All server communication goes through `services/api.js` — no inline `fetch`/`axios` calls in components.
- The `useWebSocket` hook manages connection lifecycle (open, message, reconnect, teardown).
- Pages are co-located under `pages/`; reusable UI pieces go under `components/`.
- Tailwind utility classes are used directly in JSX — no separate CSS files except `index.css` for base resets.

### Running Linters

```bash
# Backend
cd backend && go vet ./...

# Frontend
cd frontend && npm run lint
```

### Building for Production

```bash
# Frontend build (outputs to frontend/dist)
cd frontend && npm run build

# Backend binary
cd backend && go build -o pulsepoll ./cmd/server
```

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Cookie-based dedup only** | The voter token is stored in a browser cookie. Clearing cookies or using a different browser lets the same person vote again. This is by design for anonymous participation — a full auth-gated solution would require all voters to sign in. |
| **No horizontal scaling (single node)** | The in-process `Hub` holds WebSocket client connections in memory. To run multiple server instances behind a load balancer the Hub must be replaced with a distributed approach (e.g., each node subscribes to Redis and all nodes run their own Hub). The Redis Pub/Sub layer is already in place for this upgrade path. |
| **No rate limiting** | Vote and auth endpoints currently have no rate limiting. Add a middleware (e.g., `gin-contrib/ratelimit`) before deploying publicly. |
| **No HTTPS enforcement** | Configure TLS termination at a reverse proxy (nginx / Caddy) in front of the Go server for production. |

---

## Contributing

1. **Fork** the repository and create a feature branch: `git checkout -b feat/my-feature`
2. Follow the conventions described in the [Development Guide](#development-guide).
3. Keep commits small and descriptive (`feat:`, `fix:`, `chore:` prefixes encouraged).
4. Open a **Pull Request** against `main` with a clear description of changes and testing steps.
5. All CI checks (lint + build) must pass before merge.

---

<div align="center">
  <sub>Built with ❤️ using Go + React</sub>
</div>
