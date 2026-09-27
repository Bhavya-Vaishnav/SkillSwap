# SkillSwap — Backend API

A credit-based peer-to-peer skill exchange platform where users offer skills they know and request sessions for skills
they want to learn. Built entirely with **Spring Boot 4.1** and **Java 21**.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Framework  | Spring Boot 4.1, Spring Security, Spring AI 2.0 |
| Language   | Java 21                                         |
| Database   | PostgreSQL (Supabase) + pgvector                |
| Caching    | Redis (Spring Cache + Bucket4j)                 |
| AI         | Google Gemini (Chat + Embeddings via Spring AI) |
| Migrations | Flyway                                          |
| Auth       | Stateless JWT (jjwt) + BCrypt                   |
| Docs       | Swagger / OpenAPI 3 (springdoc)                 |
| Testing    | JUnit 5, Testcontainers, JaCoCo                 |

---

## Architecture

```
com.bhavya.skillswap
├── auth/           # Registration, login, JWT-based authentication
├── user/           # User profiles, bio management, semantic user search
├── skill/          # Skill catalog, vector similarity search
├── userskill/      # User ↔ Skill mapping (offered/wanted), AI bio parsing
├── session/        # Session lifecycle, state machine, AI price suggestions
├── ledger/         # Double-entry credit ledger, balance, transfers
├── config/         # Security, Redis, OpenAPI configuration
├── filter/         # JWT auth filter
└── common/
    ├── ai/         # Spring AI services (embeddings, chat, tool calling)
    ├── ratelimit/  # Distributed rate limiting (Bucket4j + Redis)
    ├── exception/  # Global exception handler + custom exceptions
    └── util/       # JWT utility
```

Each domain module follows a consistent **Controller → Service → Repository → Entity** layered structure with
request/response DTOs.

---

## Key Features

### 🔐 Authentication & Security

- Stateless JWT authentication with Spring Security filter chain
- BCrypt password hashing
- Per-user distributed rate limiting using Bucket4j backed by Redis (Lettuce)
- Role-based endpoint protection (`/api/auth/**` public, everything else authenticated)

### 🤖 AI-Powered Features (Spring AI + Gemini)

- **Bio Parsing** — LLM extracts offered/wanted skills with proficiency levels from free-text user bios
- **Skill Search** — Vector similarity search over skills using Gemini embeddings + pgvector (cosine distance)
- **User Matching** — Semantic search to find compatible users based on bio + skill embeddings
- **Price Suggestion** — Agentic pricing assistant that uses **Spring AI Tool Calling** to query real session history
  from the database and return data-driven price recommendations

### 💰 Double-Entry Credit Ledger

- Every credit transfer creates a debit + credit entry pair grouped by a transaction ID
- **Pessimistic row-level locking** with consistent lock ordering (lower UUID first) to prevent deadlocks
- Balance derived from `SUM(amount)` — no mutable balance field, ensuring auditability
- Signup bonus granted on registration (100 credits)
- Insufficient balance checks within the same transaction boundary

### 📅 Session Lifecycle (State Machine)

Sessions follow a strict state machine with guarded transitions:

```
REQUESTED → ACCEPTED → COMPLETED
    │           │
    ↓           ↓
 REJECTED   DISPUTED
    │
    ↓
 CANCELLED (also from ACCEPTED)
```

- Only the **provider** can accept/reject
- Only the **requester** can mark complete (triggers credit transfer)
- Either participant can cancel or dispute
- Session completion and credit transfer happen in a **single transaction** — if the transfer fails, the session stays
  `ACCEPTED`

### ⚡ Caching & Performance

- **Redis-backed Spring Cache** on user profiles, user skills, sessions, skill catalog, parsed bios, and pricing stats
- Targeted `@CacheEvict` on every write operation to keep cache consistent
- HikariCP connection pool tuning

### 🧪 Testing

- Unit tests for all service layers
- Integration tests using **Testcontainers** (PostgreSQL)
- **Concurrency tests** for ledger to validate thread-safe credit transfers under parallel load
- **JaCoCo** for code coverage reporting

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint    | Description                                        |
|--------|-------------|----------------------------------------------------|
| POST   | `/register` | Register new user (grants 100 credit signup bonus) |
| POST   | `/login`    | Login and receive JWT                              |
| PUT    | `/password` | Update password (authenticated)                    |

### Users (`/api/users`)

| Method | Endpoint                     | Description                                  |
|--------|------------------------------|----------------------------------------------|
| PUT    | `/me/bio`                    | Update your bio (triggers embedding reindex) |
| GET    | `/search?query=`             | Semantic search for matching users           |
| GET    | `/{userId}`                  | Get public profile                           |
| GET    | `/by-skill?skillName=&role=` | Find users by skill                          |

### Skills (`/api/skills`)

| Method | Endpoint         | Description                                   |
|--------|------------------|-----------------------------------------------|
| POST   | `/`              | Create a skill (idempotent, case-insensitive) |
| GET    | `/`              | List all skills                               |
| GET    | `/search?query=` | Vector similarity search                      |

### User Skills (`/api/user-skills`)

| Method | Endpoint            | Description                       |
|--------|---------------------|-----------------------------------|
| POST   | `/`                 | Add a skill (offered/wanted)      |
| GET    | `/me`               | Get your skills                   |
| GET    | `/user/{userId}`    | Get another user's skills         |
| DELETE | `/{id}`             | Remove a skill                    |
| PATCH  | `/{id}/proficiency` | Update proficiency level          |
| POST   | `/parse-bio`        | AI-extract skills from bio text   |
| POST   | `/confirm-bio`      | Confirm and save AI-parsed skills |

### Sessions (`/api/sessions`)

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| POST   | `/`                         | Request a session                             |
| POST   | `/{id}/accept`              | Provider accepts (sets meeting link)          |
| POST   | `/{id}/reject`              | Provider rejects                              |
| POST   | `/{id}/cancel`              | Either participant cancels                    |
| POST   | `/{id}/dispute`             | Either participant disputes                   |
| POST   | `/{id}/complete`            | Requester confirms → triggers credit transfer |
| GET    | `/me`                       | List your sessions                            |
| GET    | `/suggest-price?skillName=` | AI-powered price suggestion                   |

### Ledger (`/api/ledger`)

| Method | Endpoint    | Description                      |
|--------|-------------|----------------------------------|
| GET    | `/balance`  | Get your credit balance          |
| POST   | `/transfer` | Transfer credits to another user |
| GET    | `/history`  | Get transaction history          |

---

## Database Schema

Managed via **Flyway** migrations (`V1` through `V4`):

- **users** — id, email, password_hash, display_name, bio
- **skills** — id, name (unique, case-insensitive), category
- **user_skills** — user_id, skill_id, role (OFFERED/WANTED), proficiency (BEGINNER → EXPERT)
- **sessions** — requester_id, provider_id, skill_id, credit_amount, status, meeting_link
- **ledger_entries** — txn_group_id, user_id, amount, entry_type, reference_id
- **vector_store** — pgvector table for skill & user embeddings (768-dim, cosine distance)

---

## Environment Variables

| Variable          | Description                               |
|-------------------|-------------------------------------------|
| `DB_PASSWORD`     | PostgreSQL password                       |
| `REDIS_HOST`      | Redis host                                |
| `REDIS_PORT`      | Redis port (default: 6379)                |
| `REDIS_PASSWORD`  | Redis password                            |
| `GEMINI_API_KEY`  | Google Gemini API key                     |
| `GEMINI_MODEL`    | Gemini model name for chat                |
| `JWT_SECRET`      | Secret key for JWT signing                |
| `SWAGGER_ENABLED` | Enable/disable Swagger UI (default: true) |

---

## Running Locally

```bash
# Set environment variables (or use .env)
export DB_PASSWORD=xxx
export REDIS_HOST=localhost
export GEMINI_API_KEY=xxx
export JWT_SECRET=xxx
export GEMINI_MODEL=gemini-2.0-flash

# Run
./mvnw spring-boot:run

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

## Running Tests

```bash
# Requires Docker (for Testcontainers)
./mvnw test

# Coverage report (JaCoCo)
# Generated at target/site/jacoco/index.html
```
