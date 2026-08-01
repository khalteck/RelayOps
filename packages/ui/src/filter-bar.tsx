import type { ReactNode } from "react";

export function FilterBar({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <section className="relay-filter-bar" aria-label="Table filters">
      <div className="relay-filter-bar__primary">{primary}</div>
      {secondary ? <div className="relay-filter-bar__secondary">{secondary}</div> : null}
    </section>
  );
}
