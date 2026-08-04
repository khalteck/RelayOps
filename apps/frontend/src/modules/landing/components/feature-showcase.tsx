import { incidentDrawerImage } from "../product-art";
import { ProductWindow } from "./product-window";

export function FeatureShowcase() {
  const revealClass =
    "translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100";
  const operationClass = `${revealClass} min-h-[390px] overflow-hidden rounded-[18px] border border-[var(--relay-border)] bg-[color:var(--relay-bg)] p-[34px] max-[600px]:min-h-[350px] max-[600px]:px-6 max-[600px]:py-7`;
  const labelClass =
    "m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--relay-accent)]";
  const headingClass = "mb-3 mt-4 text-[25px] leading-[1.15] tracking-[-0.04em]";

  return (
    <section
      id="product"
      className="scroll-mt-20 border-y border-[var(--relay-border)] bg-[color:var(--relay-surface)] py-[150px] max-[600px]:py-[100px]"
    >
      <div className="mx-auto w-[calc(100%-48px)] max-w-[1240px] max-[600px]:w-[calc(100%-32px)]">
        <div className={`${revealClass} max-w-[910px]`} data-reveal>
          <p className={labelClass}>Operational context, kept intact</p>
          <h2 className="my-[18px] mb-6 text-[clamp(38px,5.2vw,68px)] leading-[1.02] tracking-[-0.06em] max-[600px]:text-[40px]">
            The response lives beside the work—not across five tabs.
          </h2>
          <p className="max-w-[650px] text-[17px] leading-[1.65] text-[var(--relay-text-secondary)]">
            Open a URL-addressable incident drawer, act within your role, and follow the immutable
            record without leaving the incident queue.
          </p>
        </div>
        <div className={`${revealClass} mt-16`} data-reveal>
          <ProductWindow
            src={incidentDrawerImage}
            title="incidents / checkout-timeouts"
            alt="RelayOps incident drawer showing assignment, SLA state, comments, and timeline"
            variant="feature"
          />
        </div>
        <div className="mt-3.5 grid grid-cols-[0.9fr_1.2fr_0.9fr] gap-3.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          <article className={operationClass} data-reveal>
            <p className={labelClass}>Deadline intelligence</p>
            <div
              className="mx-auto mb-[30px] mt-11 grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(var(--relay-danger)_0_20%,var(--relay-surface-muted)_20%_100%)]"
              aria-hidden="true"
            >
              <span className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[color:var(--relay-bg)] text-[22px] font-bold">
                20%
              </span>
            </div>
            <h3 className={headingClass}>See risk before breach.</h3>
            <p className="leading-[1.65] text-[var(--relay-text-secondary)]">
              Workspace policy snapshots keep every active acknowledgement and resolution target
              honest.
            </p>
            <div className="mt-6 grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-1 rounded-[10px] border border-[var(--relay-border)] bg-[color:var(--relay-surface)] p-[13px] text-[11px]">
              <span>Resolution</span>
              <strong>00:42:18</strong>
              <b className="col-span-full text-[9px] text-[var(--relay-success)]">On track</b>
            </div>
          </article>
          <article
            className={`${operationClass} max-[900px]:col-span-2 max-[600px]:col-auto`}
            data-reveal
          >
            <p className={labelClass}>Chronological by design</p>
            <h3 className={headingClass}>Every operational change leaves a readable trail.</h3>
            <ul className="mt-9 grid list-none gap-0 p-0">
              <li className="grid min-h-[70px] grid-cols-[16px_1fr] gap-3">
                <i className="relative mt-[3px] h-[9px] w-[9px] rounded-full bg-[#665cf6] after:absolute after:left-1 after:top-[9px] after:h-[61px] after:w-px after:bg-[color:var(--relay-border)] after:content-['']" />
                <span>
                  <strong className="block text-xs">Status changed</strong>
                  <small className="mt-[5px] block text-[10px] text-[var(--relay-text-secondary)]">
                    Investigating → Monitoring · 2m ago
                  </small>
                </span>
              </li>
              <li className="grid min-h-[70px] grid-cols-[16px_1fr] gap-3">
                <i className="relative mt-[3px] h-[9px] w-[9px] rounded-full bg-[#ef6b72] after:absolute after:left-1 after:top-[9px] after:h-[61px] after:w-px after:bg-[color:var(--relay-border)] after:content-['']" />
                <span>
                  <strong className="block text-xs">Comment added</strong>
                  <small className="mt-[5px] block text-[10px] text-[var(--relay-text-secondary)]">
                    Latency is stable across all regions · 6m ago
                  </small>
                </span>
              </li>
              <li className="grid min-h-[70px] grid-cols-[16px_1fr] gap-3">
                <i className="mt-[3px] h-[9px] w-[9px] rounded-full bg-[#f3a953]" />
                <span>
                  <strong className="block text-xs">Responder assigned</strong>
                  <small className="mt-[5px] block text-[10px] text-[var(--relay-text-secondary)]">
                    Maya Chen · 14m ago
                  </small>
                </span>
              </li>
            </ul>
          </article>
          <article className={operationClass} data-reveal>
            <p className={labelClass}>Access with boundaries</p>
            <h3 className={headingClass}>Useful permissions, enforced twice.</h3>
            <div
              className="mt-11 grid grid-cols-[1.25fr_repeat(3,1fr)] border-l border-t border-[var(--relay-border)] text-[9px] [&>*]:m-0 [&>*]:grid [&>*]:min-h-[46px] [&>*]:place-items-center [&>*]:border-b [&>*]:border-r [&>*]:border-[var(--relay-border)] [&>*]:p-[7px] [&>*]:text-center [&>b]:text-[var(--relay-accent)] [&>i]:not-italic [&>i]:text-[var(--relay-text-muted)] [&>span]:justify-items-start [&>span]:text-[var(--relay-text-secondary)]"
              aria-label="Example role capabilities"
            >
              <span>Owner</span>
              <b>Manage</b>
              <b>Respond</b>
              <b>Audit</b>
              <span>Responder</span>
              <i>—</i>
              <b>Assigned</b>
              <i>—</i>
              <span>Viewer</span>
              <i>—</i>
              <i>Read</i>
              <i>—</i>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
