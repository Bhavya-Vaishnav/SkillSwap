# SkillSwap Frontend — Complete Architecture, UI Specification & AI Build Prompt

## 1. Project Goal

Build a modern, production-style frontend for **SkillSwap**, a peer-to-peer skill tutoring marketplace.

Core journey:

**Register → AI creates skills → Discover people → Request session → AI suggests credits → Provider accepts → Meeting →
Complete**

The frontend must use the existing **Spring Boot + Swagger/OpenAPI** backend as its source of truth. The backend already
exposes authentication, users, skills, user skills, sessions, AI price suggestions, and ledger/credit functionality.

---

# 2. Non-Negotiable Design Direction

The UI MUST be visually distinctive.

## Theme

**Dark + green / emerald futuristic marketplace.**

Do NOT create a generic:

- Bootstrap dashboard
- plain dark admin panel
- standard SaaS template
- purple AI interface
- generic cards everywhere

The design should feel like a **premium peer-to-peer network for exchanging knowledge**.

### Suggested visual language

- Deep near-black background: `#07100D` / `#08110E`
- Primary emerald/green: `#00E676` or a similar vivid green
- Secondary green: `#19C37D`
- Muted green: `#6EE7B7`
- Text: off-white rather than pure white
- Borders: subtle translucent green/white
- Cards: dark glass / layered surfaces
- Accent glow: restrained emerald glow
- Rounded corners: medium, not excessively bubbly
- Typography: modern, clean, strong hierarchy
- Icons: Lucide React
- Animations: subtle and purposeful

Use gradients sparingly. Green should be an accent, not a wall of neon.

## Unique visual concept

Treat skills as **nodes in a living knowledge network**.

Examples:

- Skill cards can have small connection indicators.
- Matching results can visually suggest a connection between two people.
- Dashboard can show a small "skill network" visualization.
- AI actions can use a subtle green pulse/orbit effect.
- Credit balance can look like a compact digital wallet.
- Session lifecycle can be displayed as a connected timeline.

Do not sacrifice usability for visual effects.

---

# 3. Locked Tech Stack

| Layer               | Choice                         |
|---------------------|--------------------------------|
| Framework           | React + Vite                   |
| Language            | TypeScript, strict mode        |
| Routing             | React Router                   |
| Data fetching/cache | TanStack Query                 |
| Forms               | React Hook Form + Zod          |
| Styling             | Tailwind CSS                   |
| Icons               | Lucide React                   |
| HTTP                | Axios                          |
| API types           | `openapi-typescript` or Orval  |
| Testing             | Vitest + React Testing Library |
| API mocking         | MSW                            |

The frontend must be responsive on desktop, tablet, and mobile.

---

# 4. Swagger/OpenAPI Is the Source of Truth

The frontend must follow the existing Swagger/OpenAPI specification.

Current major API groups:

```text
/api/auth/*
/api/users/*
/api/user-skills/*
/api/skills/*
/api/sessions/*
/api/ledger/*
```

Important endpoints include:

```text
POST /api/auth/register
POST /api/auth/login

PUT  /api/users/me/bio
GET  /api/users/search

POST /api/user-skills
POST /api/user-skills/parse-bio
POST /api/user-skills/confirm-bio
GET  /api/user-skills/me
GET  /api/user-skills/user/{userId}

GET  /api/skills
POST /api/skills
GET  /api/skills/search

POST /api/sessions
GET  /api/sessions/me
GET  /api/sessions/suggest-price
POST /api/sessions/{id}/accept
POST /api/sessions/{id}/reject
POST /api/sessions/{id}/complete
POST /api/sessions/{id}/cancel
POST /api/sessions/{id}/dispute

GET  /api/ledger/balance
POST /api/ledger/transfer
```

Do not invent endpoints, request fields, response fields, or business rules.

Generate API types directly from Swagger:

```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/api/generated/schema.ts
```

If the backend Swagger specification changes, regenerate the types.

Generated types must never be manually edited.

---

# 5. Recommended Project Structure

```text
src/
├── api/
│   ├── generated/
│   │   └── schema.ts
│   ├── client.ts
│   └── endpoints/
│       ├── auth.ts
│       ├── users.ts
│       ├── skills.ts
│       ├── userSkills.ts
│       ├── sessions.ts
│       └── ledger.ts
│
├── queries/
│   ├── useAuth.ts
│   ├── useUsers.ts
│   ├── useSkills.ts
│   ├── useUserSkills.ts
│   ├── useSessions.ts
│   └── useLedger.ts
│
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── auth/
│   ├── skills/
│   ├── sessions/
│   ├── profile/
│   └── credits/
│
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── DiscoverPage.tsx
│   ├── SkillDetailsPage.tsx
│   ├── UserProfilePage.tsx
│   ├── MySkillsPage.tsx
│   ├── SessionsPage.tsx
│   ├── SessionDetailsPage.tsx
│   ├── CreditsPage.tsx
│   └── ProfilePage.tsx
│
├── context/
│   └── AuthContext.tsx
│
├── routes/
│   ├── ProtectedRoute.tsx
│   ├── PublicRoute.tsx
│   └── AppRoutes.tsx
│
├── hooks/
├── schemas/
├── utils/
├── assets/
├── App.tsx
└── main.tsx
```

API endpoint files should be thin. Components must not call Axios directly.

Use:

**endpoint wrapper → TanStack Query hook → component**

---

# 6. Authentication and Security

The current backend returns the JWT in the authentication response.

Preferred approach:

- Keep access JWT in memory through `AuthContext`.
- Do NOT put access JWT in `localStorage`.
- Do NOT put access JWT in `sessionStorage`.
- Attach the JWT through an Axios interceptor.
- Handle `401` centrally.
- If a refresh-token flow is later added, prefer an httpOnly Secure SameSite cookie for the refresh token.

Protected routes:

```text
ProtectedRoute
    ↓
Dashboard
Discover
My Skills
Sessions
Credits
Profile
```

Public routes:

```text
Landing
Login
Register
```

Do not render sensitive session contact information for sessions that are not accepted. Backend remains the real
security boundary.

Never render user-generated text using `dangerouslySetInnerHTML`.

Use environment variables for the API base URL.

Example:

```text
VITE_API_BASE_URL=http://localhost:8080
```

---

# 7. Global Navigation

After authentication:

```text
┌──────────────────────────────────────────────────────────────┐
│ SkillSwap       Dashboard  Discover  Sessions  Credits  👤  │
└──────────────────────────────────────────────────────────────┘
```

Desktop:

- compact top navigation or sidebar
- active route clearly highlighted with emerald accent

Mobile:

- bottom navigation or compact menu
- keep important actions easily reachable

Primary navigation:

```text
Dashboard
Discover
My Skills
Sessions
Credits
Profile
```

---

# 8. Page and User Flow Specification

## 8.1 Landing Page

Purpose: explain the product quickly.

### Hero

Headline:

**Learn. Teach. Exchange.**

Supporting message:

**Turn your skills into opportunities and your curiosity into new skills.**

Primary actions:

```text
[ Start Swapping ]
[ Explore Skills ]
```

Visual:

- dark network background
- connected skill nodes
- subtle emerald animated lines
- no excessive particle effects

### How It Works

```text
01  Build your skill profile
02  Find the right person
03  Exchange knowledge with credits
04  Complete the session
```

Feature areas:

- AI skill extraction
- Skill matching
- Credit-based sessions
- AI price advisory
- Secure session workflow

---

# 8.2 Register

Fields:

- Display name
- Email
- Password

API:

```text
POST /api/auth/register
```

After registration:

- authenticate the user
- take them into the onboarding flow
- encourage AI-based skill extraction

---

# 8.3 Login

Fields:

- Email
- Password

API:

```text
POST /api/auth/login
```

Successful login → Dashboard.

---

# 8.4 AI Skill Onboarding

This should be one of the signature experiences of SkillSwap.

### Step 1 — Tell your story

```text
Tell SkillSwap what you know

"I'm a Java developer with experience in
Spring Boot, PostgreSQL and REST APIs.
I want to learn React."

[ ✦ Discover My Skills ]
```

API:

```text
POST /api/user-skills/parse-bio
```

### Step 2 — AI result

Show two visual groups:

```text
YOU CAN TEACH

Java                 Advanced
Spring Boot          Advanced
PostgreSQL           Intermediate


YOU WANT TO LEARN

React
```

Allow editing.

### Step 3 — Confirm

```text
[ Back ]        [ Confirm Skills ]
```

API:

```text
POST /api/user-skills/confirm-bio
```

Use a subtle AI scanning / green pulse animation while processing.

---

# 8.5 Dashboard

The dashboard should feel like a **personal knowledge command center**, not a normal admin dashboard.

Top:

```text
Good to see you, Bhavya

Your learning network is growing.
```

Stats:

```text
┌──────────────┐ ┌──────────────┐
│ 120          │ │ 3            │
│ Credits      │ │ Skills       │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 2            │ │ 5            │
│ Active       │ │ Matches      │
└──────────────┘ └──────────────┘
```

Main areas:

### Recommended Matches

Show people/skills that match the user's wanted skills.

### Active Sessions

Show current sessions and their state.

### Skill Network

A small visual area showing:

```text
              Java
             /    \
        Spring     SQL
           \       /
             You
              |
            React
```

Keep it lightweight and readable.

APIs:

```text
GET /api/ledger/balance
GET /api/user-skills/me
GET /api/sessions/me
GET /api/skills/search
GET /api/users/search
```

---

# 8.6 Discover

Purpose: discover skills and people.

Top:

```text
Discover knowledge

[ 🔍 Search for a skill... ]
```

Popular skill chips:

```text
Java   React   Python   SQL   Spring Boot
```

Results should support two visual modes:

### Skill view

```text
Java
Backend Development

People offering this skill: ...
[ Explore ]
```

### People view

```text
Alex Sharma
Spring Boot • Java • PostgreSQL

Advanced Java
Expert Spring Boot

[ View Profile ]
```

APIs:

```text
GET /api/skills
GET /api/skills/search?query=
GET /api/users/search?query=
```

---

# 8.7 User / Tutor Profile

Show:

- Display name
- Bio
- Offered skills
- Wanted skills
- Proficiency
- Request Session button

API:

```text
GET /api/user-skills/user/{userId}
```

Design idea:

Use a large profile header with a subtle green radial glow and skill "badges" around the profile.

Do not show private contact details unless the backend response allows them.

---

# 8.8 My Skills

Two sections:

### I can teach

```text
Java             Advanced
Spring Boot      Advanced
PostgreSQL       Intermediate
```

### I want to learn

```text
React
System Design
```

API:

```text
GET /api/user-skills/me
POST /api/user-skills
```

Use distinct visual treatment for OFFERED and WANTED.

---

# 8.9 Session Request

When requesting a session:

```text
Request a learning session

Java
with Alex Sharma

AI price advisory

┌──────────────────────────────────┐
│ Based on previous sessions       │
│                                  │
│ Around 8 credits                 │
└──────────────────────────────────┘

Your offer
[ 8 ]

[ Send Request ]
```

APIs:

```text
GET /api/sessions/suggest-price?skillName=Java
POST /api/sessions
```

The price suggestion is advisory only.

The provider sets the final price during acceptance.

Do not imply that AI controls the final price.

---

# 8.10 Sessions

Use clear categories:

```text
Incoming
Outgoing
Active
Completed
```

Session states:

```text
REQUESTED
ACCEPTED
COMPLETED
DISPUTED
REJECTED
CANCELLED
```

### Requested

```text
Java
Alex Sharma
8 credits

REQUESTED

[ Accept ] [ Reject ]
```

### Accepted

```text
Java
Alex Sharma
8 credits

ACCEPTED

[ Join Meeting ]
[ Complete ]
[ Dispute ]
```

### Completed

Show a clean completed state.

### Disputed

Make the state visually clear without using alarming colors excessively.

APIs:

```text
GET /api/sessions/me
POST /api/sessions/{id}/accept
POST /api/sessions/{id}/reject
POST /api/sessions/{id}/complete
POST /api/sessions/{id}/cancel
POST /api/sessions/{id}/dispute
```

---

# 8.11 Session Details

Show:

- Skill
- Status
- Credit amount
- Requester name
- Provider name
- Meeting link when available
- Email when permitted by backend
- Actions allowed for the current state

The session lifecycle should be represented visually:

```text
Requested
   │
   ▼
Accepted
   │
   ▼
Completed
```

Alternative branches:

```text
Requested → Rejected
Requested → Cancelled
Accepted  → Disputed
```

Use a connected timeline rather than a plain text status.

---

# 8.12 Credits / Wallet

Make this visually different from a standard transaction table.

Top:

```text
YOUR BALANCE

120
CREDITS
```

Transaction feed:

```text
+10   Signup bonus
      Sep 18

-8    Java session
      Sep 17

+5    React session
      Sep 15
```

API:

```text
GET /api/ledger/balance
POST /api/ledger/transfer
```

Use green for positive balance changes and a muted contrasting color for outgoing transactions.

Do not invent a transaction-history endpoint if the backend does not provide one.

---

# 8.13 Profile

Show:

- Display name
- Email
- Bio
- Offered skills
- Wanted skills

Bio update:

```text
PUT /api/users/me/bio
```

---

# 9. API Data Fetching Pattern

Every API-driven page must have:

1. Loading state
2. Error state
3. Empty state
4. Success state

Use TanStack Query.

Example:

```tsx
const { data, isLoading, isError } = useSessions();

if (isLoading) return <SessionSkeleton />;
if (isError) return <ErrorState />;
if (!data?.length) return <EmptySessions />;
return <SessionList sessions={data} />;
```

Do not hand-roll global loading/cache logic.

---

# 10. Forms and Validation

Use:

- React Hook Form
- Zod

Forms include:

- Register
- Login
- Bio input
- Bio edit
- Add skill
- Session request
- Accept session

Schemas should mirror generated API request types.

Frontend validation improves UX, but the backend remains the source of truth.

---

# 11. Error Handling

Centralize Axios error handling.

Convert backend errors into a consistent UI shape:

```text
{
  message,
  fieldErrors?
}
```

Never display:

- stack traces
- raw database errors
- internal exception details

Handle:

```text
400
401
403
404
409
429
500
```

429 should disable repeated submission temporarily and show a useful retry message.

---

# 12. API Client

Use a central Axios client:

```text
src/api/client.ts
```

Responsibilities:

- Base URL from environment
- Authorization header
- 401 handling
- Error normalization
- Request/response interceptors

Components must never directly call Axios.

---

# 13. Generated API Types

Use:

```text
openapi-typescript
```

or:

```text
orval
```

Generate types into:

```text
src/api/generated/
```

Rule:

> If a field or endpoint does not exist in generated Swagger types, the frontend must not invent it.

If the AI discovers a mismatch between the desired UI and the API, it must clearly flag the mismatch instead of creating
fake frontend data or fake endpoints.

---

# 14. Security Rules

Mandatory:

- No JWT in localStorage
- No JWT in sessionStorage
- Use in-memory AuthContext for the access token
- API base URL from environment variables
- Never use `dangerouslySetInnerHTML` for user-generated content
- Do not expose email/contact data before the backend permits it
- Do not trust client-side validation
- Do not put backend secrets in the frontend
- Do not implement business rules that belong to Spring Boot

---

# 15. Testing

Use:

```text
Vitest
React Testing Library
MSW
```

At minimum, every page should have a smoke test covering:

- page renders
- loading state
- empty state
- error state

Mock APIs using the generated contract.

---

# 16. UX Rules

Every API page must provide:

### Loading

Use skeleton loaders rather than a blank page.

### Empty

Explain what the user can do next.

Example:

```text
No active sessions

Find someone who can teach you a skill.

[ Explore Skills ]
```

### Error

```text
Something went wrong.

We couldn't load your sessions.

[ Try Again ]
```

### Success

Use lightweight toast/inline feedback.

Avoid excessive popups.

---

# 17. Responsive Design

Desktop:

- spacious two-column layouts where useful
- sidebar/top navigation
- larger discovery grid

Tablet:

- reduce columns
- preserve important actions

Mobile:

- single-column layouts
- bottom navigation or compact menu
- cards become full-width
- session actions remain easy to reach
- no horizontal scrolling

---

# 18. Design System

Create reusable components:

```text
Button
IconButton
Input
Textarea
Select
Modal
Drawer
Card
Badge
Avatar
SkillChip
StatusBadge
Skeleton
Toast
EmptyState
ErrorState
StatCard
SessionCard
SkillCard
UserCard
CreditCard
Timeline
```

Create a consistent design token system.

Example:

```text
background:
  primary: near-black green
  secondary: dark green-black
  elevated: slightly lighter green-black

accent:
  primary: emerald
  soft: muted emerald
  glow: translucent emerald

text:
  primary: off-white
  secondary: muted gray-green
```

Do not use a different style on every page.

---

# 19. Animation Rules

Animations should communicate state, not exist only for decoration.

Good uses:

- AI skill extraction → subtle scanning animation
- Skill matching → connected node animation
- Credit transfer → small balance transition
- Session state → timeline transition
- Button hover → subtle glow
- Page transitions → short fade/slide

Avoid:

- excessive bouncing
- constant background movement
- huge particle systems
- slow transitions
- animations that reduce readability

Respect `prefers-reduced-motion`.

---

# 20. AI Frontend Build Prompt

Copy the following prompt into the AI coding tool.

---

## MASTER PROMPT

You are building the frontend for **SkillSwap**, a peer-to-peer skill tutoring marketplace.

The backend is already implemented using Spring Boot and exposes a Swagger/OpenAPI specification.

Your job is to build a complete, polished, production-style frontend.

### FIRST: Understand the contract

Before writing UI code:

1. Read the provided Swagger/OpenAPI specification.
2. Generate TypeScript API types using `openapi-typescript` or Orval.
3. Inspect all available endpoints, request models, response models, enums, and authentication requirements.
4. Treat generated Swagger types as the single source of truth.
5. Never invent endpoints, fields, responses, or backend business rules.
6. If the desired UI requires something that the API does not provide, do not fake it. Clearly identify the gap.

### STACK

Use:

- React + Vite
- TypeScript strict mode
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Tailwind CSS
- Lucide React
- Vitest
- React Testing Library
- MSW

### ARCHITECTURE

Use this structure:

```text
src/
├── api/
│   ├── generated/
│   ├── client.ts
│   └── endpoints/
├── queries/
├── components/
├── pages/
├── context/
├── routes/
├── hooks/
├── schemas/
├── utils/
├── assets/
├── App.tsx
└── main.tsx
```

Components must not call Axios directly.

Use:

```text
API endpoint wrapper
        ↓
TanStack Query hook
        ↓
React component
```

### AUTHENTICATION

The backend currently returns JWT in the response.

Do not store the access JWT in localStorage or sessionStorage.

Keep the access token in memory through AuthContext.

Use an Axios interceptor to attach:

```text
Authorization: Bearer <token>
```

Handle 401 centrally.

Protect authenticated routes with `ProtectedRoute`.

Public routes should redirect authenticated users to the dashboard.

### DESIGN — THIS IS CRITICAL

The UI must be unique.

Use a **dark emerald/green knowledge-network aesthetic**.

Do not produce a generic SaaS dashboard.

Design inspiration should feel like:

- knowledge network
- premium developer platform
- modern marketplace
- subtle futuristic interface

Primary visual direction:

```text
Near-black green background
+
Emerald accent
+
Subtle green glow
+
Glass/layered dark surfaces
+
Strong typography
+
Skill network visuals
```

Suggested colors:

```text
#07100D
#08110E
#00E676
#19C37D
#6EE7B7
```

You may adjust the exact shades if the resulting design is more cohesive.

Use green as an accent rather than making the entire UI neon.

Create a custom design system and reusable components.

### UNIQUE VISUAL IDEA

Represent knowledge as a network.

Use subtle visual relationships between:

```text
User
  ↓
Skills
  ↓
Matches
  ↓
Sessions
  ↓
Credits
```

The dashboard can contain a small interactive-looking skill network.

Matching pages can use connected cards or relationship lines.

AI operations can use subtle green scanning/pulse effects.

Session status can use a connected timeline.

Credits can feel like a digital wallet.

These visuals must remain clean and usable.

### REQUIRED PAGES

Build:

1. Landing Page
2. Login
3. Register
4. Dashboard
5. Discover Skills
6. Skill Details
7. User/Tutor Profile
8. My Skills
9. AI Bio-to-Skills onboarding
10. Sessions
11. Session Details
12. Credits
13. Profile

### CORE USER FLOW

Implement this complete flow:

```text
Register
   ↓
AI Skill Onboarding
   ↓
Confirm Skills
   ↓
Dashboard
   ↓
Discover Skills
   ↓
View User
   ↓
Request Session
   ↓
AI Price Advisory
   ↓
Send Session Request
   ↓
Provider Accepts
   ↓
Meeting Link
   ↓
Complete / Dispute
```

### AI BIO FLOW

Create a polished onboarding experience:

```text
Tell us what you know and what you want to learn
              ↓
        AI processes bio
              ↓
       Detected skills
              ↓
       User reviews them
              ↓
        Confirm Skills
```

Use the actual backend endpoints:

```text
POST /api/user-skills/parse-bio
POST /api/user-skills/confirm-bio
```

Do not fake AI results.

### DISCOVERY

Create a strong marketplace experience.

Search:

```text
GET /api/skills/search
GET /api/users/search
```

Show:

- skill
- category when available
- person
- proficiency
- offered/wanted relationship
- relevant action

### SESSION REQUEST

Use:

```text
GET /api/sessions/suggest-price
POST /api/sessions
```

Show the AI price as an advisory recommendation.

The provider controls the final price.

Do not imply that AI sets the final price.

### SESSION MANAGEMENT

Use the real endpoints:

```text
GET /api/sessions/me
POST /api/sessions/{id}/accept
POST /api/sessions/{id}/reject
POST /api/sessions/{id}/complete
POST /api/sessions/{id}/cancel
POST /api/sessions/{id}/dispute
```

Represent states clearly:

```text
REQUESTED
ACCEPTED
COMPLETED
DISPUTED
REJECTED
CANCELLED
```

Use a visual timeline for session progression.

### CONTACT PRIVACY

The backend controls contact visibility.

Do not show email/contact information for sessions that are not accepted.

Treat backend data as authoritative.

### CREDITS

Use:

```text
GET /api/ledger/balance
POST /api/ledger/transfer
```

Create a premium wallet-style balance card.

Do not invent transaction history if the API does not expose it.

### DATA STATES

Every API-driven page must support:

```text
Loading
Empty
Error
Success
```

Use TanStack Query.

Use skeleton loaders.

Do not show blank screens while loading.

### ERROR HANDLING

Normalize backend errors centrally.

Never expose:

- stack traces
- database errors
- internal exception details

Handle common HTTP errors cleanly.

### FORMS

Use React Hook Form + Zod.

Validate:

- registration
- login
- bio
- skill creation
- session request
- session acceptance

Validation must match generated API types.

### RESPONSIVENESS

The application must work well on:

- desktop
- tablet
- mobile

Do not simply shrink desktop UI.

Create proper mobile layouts.

### ACCESSIBILITY

Include:

- keyboard navigation
- visible focus states
- semantic HTML
- accessible labels
- sufficient contrast
- reduced-motion support

### PERFORMANCE

Avoid unnecessary re-renders.

Use TanStack Query caching.

Lazy-load large pages where appropriate.

Do not add heavy animation libraries unless genuinely needed.

### TESTING

Use Vitest + React Testing Library.

Use MSW for API mocks.

Every major page should have a basic smoke test.

### IMPLEMENTATION ORDER

Follow these steps in order:

#### STEP 1 — Foundation

Set up:

- Vite
- TypeScript
- Tailwind
- routing
- Axios
- TanStack Query
- AuthContext
- design tokens

#### STEP 2 — API Contract

Generate types from Swagger.

Create:

```text
api/client.ts
api/endpoints/*
queries/*
```

Verify TypeScript compilation.

#### STEP 3 — Design System

Build reusable:

```text
Button
Input
Card
Badge
Modal
Avatar
SkillChip
StatusBadge
Skeleton
Toast
EmptyState
ErrorState
Timeline
```

Do this before building all pages.

#### STEP 4 — Authentication

Build:

```text
Landing
Register
Login
ProtectedRoute
PublicRoute
AuthContext
```

Verify authentication.

#### STEP 5 — Onboarding

Build:

```text
AI Bio Input
AI Skill Results
Skill Confirmation
```

Use the real APIs.

#### STEP 6 — Core Marketplace

Build:

```text
Dashboard
Discover
User Profile
My Skills
```

#### STEP 7 — Sessions

Build:

```text
Session Request
AI Price Advisory
Sessions
Session Details
Accept / Reject
Complete / Cancel / Dispute
```

#### STEP 8 — Credits

Build:

```text
Credits / Wallet
Balance
```

#### STEP 9 — Polish

Add:

- loading states
- empty states
- error states
- animations
- responsive layouts
- accessibility
- tests

#### STEP 10 — Final Verification

Before considering the frontend complete:

1. Run TypeScript compilation.
2. Run tests.
3. Verify all API calls against generated Swagger types.
4. Search the codebase for invented endpoints.
5. Search for localStorage/sessionStorage JWT usage and remove it.
6. Verify protected routes.
7. Verify contact privacy.
8. Verify every page has loading/error/empty states.
9. Verify mobile layout.
10. Verify there are no placeholder/mock API calls remaining.

Do not stop after creating only the visual pages. Build the actual API-connected frontend.

The final result should look like a real, polished product called **SkillSwap**, with a distinctive dark emerald
knowledge-network identity rather than a generic AI-generated dashboard.
