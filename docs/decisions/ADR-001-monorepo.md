# ADR-001: Use a pnpm monorepo

**Status:** Accepted

RelayOps keeps the frontend, API, shared transport contracts, UI system, and tooling in one pnpm
workspace. This makes cross-boundary changes reviewable as one unit and lets CI prove that a
contract change compiles against both consumers.

The applications remain independently buildable and deploy as separate Render services. Shared
source does not imply shared runtime or allow database models to leak into the browser.
