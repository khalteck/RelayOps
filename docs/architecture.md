# RelayOps architecture

RelayOps is a client-rendered TypeScript application whose frontend and backend deploy independently
from one pnpm workspace. Shared packages define the transport and design boundaries without coupling
the applications' runtime state.

## Repository structure

```mermaid
flowchart TB
    Root["relayops / pnpm workspace"]
    Root --> Apps
    Root --> Packages
    Root --> E2E["e2e / browser fixtures and flows"]
    Root --> CI[".github/workflows / CI gates"]
    Root --> Docs["docs / architecture, accessibility, ADRs"]
    Root --> Render["render.yaml / two-service Blueprint"]

    Apps --> Frontend["apps/frontend / React + Vite"]
    Apps --> Backend["apps/backend / Express + Socket.IO"]

    Frontend --> SharedLayers["components, hooks, helpers, routes, services, stores, types"]
    Frontend --> FrontendTests["test / centralized RTL and contract tests"]
    Frontend --> Modules["modules / vertical product slices"]
    Modules --> ModuleShape["components + operations + views + index.ts"]

    Backend --> BackendCore["config + core + middleware + models"]
    Backend --> BackendModules["modules / domain routes and services"]
    Backend --> BackendOps["scripts + test + types"]

    Packages --> Types["packages/types / Zod contracts and permissions"]
    Packages --> UI["packages/ui / accessible visual primitives"]
    Packages --> Config["packages/config / shared tooling foundations"]
```

Frontend module `index.ts` files are the supported cross-module interface. Route loaders dynamically
import `views`, module UI stays in `components`, and every TanStack Query definition lives in
`operations`. Shared-layer imports use the `@/` alias; imports within a module remain relative.

The backend retains domain-oriented modules behind common authentication, CSRF, validation,
request-context, rate-limit, error, and database infrastructure.

## Deployment topology

```mermaid
flowchart LR
    Browser --> Static["Render Static Site<br/>React/Vite CSR"]
    Browser -->|"/api/*"| Static
    Static -->|"Render rewrite"| API["Render Web Service<br/>Express + Socket.IO"]
    Browser <-->|"Direct Socket.IO + 60-second ticket"| API
    API --> Atlas["MongoDB Atlas"]
```

HTTP requests stay same-origin through the static-site rewrite. Socket.IO connects directly to the
backend after the cookie-authenticated browser exchanges its session for a short-lived ticket.
Authentication cookies never need to be exposed to the cross-origin socket connection.

## HTTP request flow

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware as Express middleware
    participant Domain as Domain service
    participant Mongo as MongoDB
    Browser->>Middleware: /api/v1 request + cookies + request ID
    Middleware->>Middleware: Security, CORS, limits, CSRF, Zod validation
    Middleware->>Domain: Authenticated user + explicit tenant context
    Domain->>Domain: Reload membership and authorize capability
    Domain->>Mongo: Tenant-scoped query or transaction
    Mongo-->>Domain: Mongoose documents
    Domain-->>Browser: DTO envelope + ISO dates + serverTime
    Note over Middleware,Browser: Errors become a normalized envelope with a request ID
```

Mongoose documents never cross the transport boundary. Repository and service functions require
explicit tenant identifiers so workspace access cannot be inferred from client input alone.

## Authentication, refresh, and logout

```mermaid
sequenceDiagram
    participant UI as React UI
    participant Query as TanStack Query
    participant API as Auth API
    participant Sessions as Refresh sessions
    UI->>API: POST /logout + HttpOnly cookies + CSRF header
    API->>API: Authenticate access token and validate CSRF
    API->>Sessions: Revoke current hashed refresh session
    API-->>UI: Clear access, refresh, and CSRF cookies; 204
    UI->>Query: Clear authenticated server cache
    UI->>UI: Navigate to /login and disconnect workspace socket
    alt Access and refresh are already unusable
        API-->>UI: 401
        UI->>Query: Treat as signed out and clear server cache
    else Network or server failure
        UI->>UI: Keep modal open and show a generic retry message
        Note over UI: Never display backend auth details
    end
```

Access cookies last 15 minutes. Refresh sessions last seven days, are stored as hashes, rotate on
use, and revoke on replay detection. Logout revokes only the current browser session; other devices
remain signed in. Theme and sidebar preferences survive because Zustand contains no authenticated
server data.

## State ownership

```mermaid
flowchart LR
    API["API and Socket.IO"] --> Query["TanStack Query<br/>remote data and cache lifecycle"]
    URL["React Router URL"] --> RouteState["tenant, filters, sort, page, saved view, drawer"]
    Forms["React Hook Form"] --> FormState["transient validated input"]
    Zustand --> ClientState["theme and desktop sidebar only"]
    Query --> UI
    RouteState --> UI
    FormState --> UI
    ClientState --> UI
```

The server remains authoritative for sessions, tenants, incidents, timelines, analytics, saved
views, notifications, and audit events. Query keys include workspace scope and normalized filters.

## Incident mutation and realtime reconciliation

```mermaid
sequenceDiagram
    participant UI as React + TanStack Query
    participant API as Express domain service
    participant DB as MongoDB transaction
    participant RT as Socket.IO workspace room
    UI->>UI: Cancel reads, snapshot cache, apply optimistic revision
    UI->>API: Validated and CSRF-protected mutation
    API->>API: Reload membership and authorize resource
    API->>DB: Incident + timeline + audit event
    alt transaction commits
        DB-->>API: Commit
        API-->>UI: Authoritative typed DTO
        API->>RT: Emit after commit
        RT-->>UI: Reconcile by incident revision
    else mutation fails
        API-->>UI: Structured error
        UI->>UI: Restore cached snapshot
    end
```

Clients discard duplicate or older revisions and invalidate only affected list, detail, timeline,
analytics, audit, or notification keys. Notifications use a separate `user:{id}` room and never
inherit workspace-room visibility.

## Testing boundaries

```mermaid
flowchart LR
    Unit["Vitest unit tests"] --> Contracts["contracts, rules, helpers, cache behavior"]
    Integration["Supertest integration"] --> Memory["ephemeral Mongo replica set"]
    RTL["RTL + MSW + jest-axe"] --> FrontendBehavior["routes, forms, failures, permissions, a11y"]
    Playwright["Playwright"] --> TestStack["isolated frontend + backend + replica set"]
    TestStack --> Browsers["Chromium workflows<br/>Firefox/WebKit smoke"]
```

Automated tests never use Atlas. The memory-backed replica set supports the same MongoDB
transactions used by incident mutations.

## CI and delivery flow

```mermaid
flowchart LR
    Commit --> Hooks["Husky + lint-staged"]
    Hooks --> GitHub["GitHub Actions"]
    GitHub --> Quality["format + lint + types"]
    GitHub --> Tests["unit + integration + coverage"]
    GitHub --> Build["production builds + bundle report"]
    GitHub --> Browser["Playwright + accessibility"]
    Quality --> Checks{All checks pass?}
    Tests --> Checks
    Build --> Checks
    Browser --> Checks
    Checks -->|yes| FrontendDeploy["Render Static Site"]
    Checks -->|yes| BackendDeploy["Render Web Service"]
    Checks -->|no| Stop["No Render auto-deploy"]
```

Both services use `autoDeployTrigger: checksPass`. Render build filters rebuild only the affected
application unless a shared package, root manifest, workspace file, or lockfile changes.

## Deliberate trade-offs

- One assignee keeps the operational model focused.
- Live aggregation avoids premature background analytics infrastructure.
- Invitations are manually shared; outbound email remains outside v1.
- The demo seed is deterministic and isolated from normal tenant creation.
- AI summarization remains deferred until the non-AI platform is deployed and reviewed.
