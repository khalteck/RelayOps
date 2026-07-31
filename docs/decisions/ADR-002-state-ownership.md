# ADR-002: Separate server and client state

**Status:** Accepted

TanStack Query owns data whose source of truth is the API: session, tenants, incidents, views,
analytics, and audit events. It provides caching, invalidation, retries, optimistic rollback, and
reconciliation after realtime events.

Zustand owns only durable interface preference: color theme and sidebar state. Active tenant and
filters remain in the URL. Form values remain local to React Hook Form. This avoids duplicated
server data, ambiguous ownership, and manual synchronization stores.
