# ADR-003: Enforce permissions in both clients and the API

**Status:** Accepted

The React application uses shared capability names to hide or disable actions the active role
cannot perform. This improves clarity but is not a security boundary.

The API reloads membership, verifies workspace access, and checks the required capability for every
protected operation. Resource lookups are tenant-scoped, so changing a URL or sending a handcrafted
request cannot cross an organisation boundary.
