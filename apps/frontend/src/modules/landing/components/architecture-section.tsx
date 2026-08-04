import { analyticsImage } from "../product-art";
import { ProductWindow } from "./product-window";

export function ArchitectureSection() {
  const revealClass =
    "translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100";
  const flowNodeClass =
    "grid min-w-0 gap-[5px] border border-[var(--relay-border)] bg-[color:var(--relay-surface)] p-[11px]";

  return (
    <section
      id="architecture"
      className="scroll-mt-20 bg-[linear-gradient(var(--relay-border)_1px,transparent_1px),linear-gradient(90deg,var(--relay-border)_1px,transparent_1px),var(--relay-bg)] bg-[size:72px_72px] py-[150px] max-[600px]:py-[100px]"
    >
      <div className="mx-auto grid w-[calc(100%-48px)] max-w-[1240px] grid-cols-[0.9fr_1.1fr] items-center gap-20 max-[900px]:grid-cols-1 max-[600px]:w-[calc(100%-32px)]">
        <div
          className={`${revealClass} border border-[var(--relay-border)] bg-[color:var(--relay-bg)]/95 p-12 backdrop-blur-md max-[600px]:px-[22px] max-[600px]:py-7`}
          data-reveal
        >
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--relay-accent)]">
            Built as an operating system, not a mockup
          </p>
          <h2 className="my-[18px] mb-6 text-[clamp(38px,5.2vw,68px)] leading-[1.02] tracking-[-0.06em] max-[600px]:text-[40px]">
            Fast in the browser. Deliberate at every boundary.
          </h2>
          <p className="leading-[1.65] text-[var(--relay-text-secondary)]">
            Typed requests, tenant-aware authorization, transaction-backed timelines, optimistic
            rollback, and revision-safe realtime updates keep the interface and source of truth
            aligned.
          </p>
          <div
            className="my-[34px] flex items-center gap-2.5 max-[600px]:flex-col max-[600px]:items-stretch"
            aria-label="RelayOps deployment architecture"
          >
            <span className={flowNodeClass}>
              <small className="text-[8px] uppercase text-[var(--relay-text-muted)]">Client</small>
              <strong className="text-[10px]">React / Vite</strong>
            </span>
            <i
              className="not-italic text-[var(--relay-accent)] max-[600px]:self-center max-[600px]:rotate-90"
              aria-hidden="true"
            >
              →
            </i>
            <span className={flowNodeClass}>
              <small className="text-[8px] uppercase text-[var(--relay-text-muted)]">
                API + realtime
              </small>
              <strong className="text-[10px]">Express / Socket.IO</strong>
            </span>
            <i
              className="not-italic text-[var(--relay-accent)] max-[600px]:self-center max-[600px]:rotate-90"
              aria-hidden="true"
            >
              →
            </i>
            <span className={flowNodeClass}>
              <small className="text-[8px] uppercase text-[var(--relay-text-muted)]">Data</small>
              <strong className="text-[10px]">MongoDB Atlas</strong>
            </span>
          </div>
          <ul className="m-0 grid list-none gap-0 border-t border-[var(--relay-border)] p-0">
            <li className="flex gap-3 border-b border-[var(--relay-border)] py-[13px] text-xs">
              <span className="font-mono text-[9px] font-semibold leading-normal text-[var(--relay-accent)]">
                01
              </span>
              Frontend permissions guide the interface.
            </li>
            <li className="flex gap-3 border-b border-[var(--relay-border)] py-[13px] text-xs">
              <span className="font-mono text-[9px] font-semibold leading-normal text-[var(--relay-accent)]">
                02
              </span>
              Backend authorization protects every operation.
            </li>
            <li className="flex gap-3 border-b border-[var(--relay-border)] py-[13px] text-xs">
              <span className="font-mono text-[9px] font-semibold leading-normal text-[var(--relay-accent)]">
                03
              </span>
              Committed revisions reconcile every live client.
            </li>
          </ul>
        </div>
        <div
          className={`${revealClass} relative min-w-0 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[740px]`}
          data-reveal
        >
          <ProductWindow
            src={analyticsImage}
            title="dashboard / 30-day performance"
            alt="RelayOps analytics dashboard with incident metrics and operational charts"
            variant="analytics"
          />
          <div
            className="absolute bottom-[38px] left-[-28px] grid min-w-[150px] gap-1 rounded-xl border border-black/10 bg-white/95 p-4 text-[#24252b] shadow-[0_18px_50px_rgb(28_25_48/13%)] max-[600px]:bottom-5 max-[600px]:left-3"
            aria-hidden="true"
          >
            <span className="text-[9px] uppercase text-[#6f717a]">MTTA</span>
            <strong className="text-[23px]">45 min</strong>
            <small className="text-[9px] uppercase text-[#6f717a]">30-day window</small>
          </div>
        </div>
      </div>
    </section>
  );
}
