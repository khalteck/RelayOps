import { RelayLogo } from "@relayops/ui";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-layout__story" aria-label="RelayOps product introduction">
        <RelayLogo />
        <div className="auth-layout__story-copy">
          <span className="signal-pill">Incident coordination, without the noise</span>
          <h1>Keep every response moving in the same direction.</h1>
          <p>
            RelayOps gives distributed teams one calm place for incident ownership, SLA visibility,
            and the operational context that matters.
          </p>
        </div>
        <div className="status-preview" aria-hidden="true">
          <span className="status-preview__pulse" />
          <div>
            <small>Platform API</small>
            <strong>Investigating elevated latency</strong>
          </div>
          <b>P1</b>
        </div>
      </section>
      <section className="auth-layout__form">
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
