const workflow = [
  { name: "Reported", detail: "Capture impact and affected service." },
  { name: "Acknowledged", detail: "Make ownership explicit." },
  { name: "Investigating", detail: "Coordinate decisions in one timeline." },
  { name: "Monitoring", detail: "Watch recovery against the SLA." },
  { name: "Resolved", detail: "Freeze the operational record." }
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="mx-auto grid w-[calc(100%-48px)] max-w-[1240px] scroll-mt-20 grid-cols-[0.8fr_1.2fr] gap-[90px] py-[150px] max-[900px]:grid-cols-1 max-[600px]:w-[calc(100%-32px)] max-[600px]:gap-[60px] max-[600px]:py-[100px]"
    >
      <div
        className="max-w-[730px] translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100"
        data-reveal
      >
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--relay-accent)]">
          A workflow teams can trust
        </p>
        <h2 className="my-[18px] mb-6 text-[clamp(38px,5.2vw,68px)] leading-[1.02] tracking-[-0.06em] max-[600px]:text-[40px]">
          One incident state.
          <br />
          No side-channel version.
        </h2>
        <p className="max-w-[650px] text-[17px] leading-[1.65] text-[var(--relay-text-secondary)]">
          RelayOps keeps ownership, decisions, deadlines, and updates on the same ordered path from
          first report to final resolution.
        </p>
      </div>
      <ol
        className="row-span-2 m-0 list-none p-0 max-[900px]:row-auto translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100"
        data-reveal
      >
        {workflow.map((step, index) => (
          <li className="grid min-h-[116px] grid-cols-[28px_24px_1fr] gap-3" key={step.name}>
            <span className="font-mono text-[11px] font-semibold leading-none text-[var(--relay-text-muted)]">
              0{index + 1}
            </span>
            <span
              className={`relative mt-0.5 h-3 w-3 rounded-full border-2 ${
                index < 3
                  ? "border-[var(--relay-accent-solid)] bg-[color:var(--relay-accent-solid)] shadow-[0_0_0_5px_rgb(102_92_246/10%)]"
                  : "border-[var(--relay-border)] bg-[color:var(--relay-bg)]"
              } ${
                index < workflow.length - 1
                  ? "after:absolute after:left-[3px] after:top-3 after:h-[102px] after:w-px after:bg-[color:var(--relay-border)] after:content-['']"
                  : ""
              }`}
              aria-hidden="true"
            />
            <div>
              <strong className="text-base">{step.name}</strong>
              <p className="mt-[7px] max-w-[300px] text-[13px] leading-normal text-[var(--relay-text-secondary)]">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <aside
        className="self-end rounded-2xl border border-[var(--relay-border)] bg-[color:var(--relay-surface)] p-6 shadow-[0_18px_50px_rgb(28_25_48/7%)] max-[900px]:w-full max-[900px]:max-w-[560px] translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100"
        data-reveal
        aria-label="Example active incident"
      >
        <div className="flex items-center justify-between gap-3 text-[10px] tracking-[0.08em] text-[var(--relay-text-secondary)]">
          <span>
            <i className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-[color:var(--relay-danger)]" />
            INC-1042
          </span>
          <b>P1 · SEV1</b>
        </div>
        <h3 className="mb-[7px] mt-6 text-xl">Checkout requests timing out</h3>
        <p className="mb-6 mt-0 text-xs text-[var(--relay-text-secondary)]">
          Platform API · Assigned to Maya Chen
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--relay-border)] pt-[18px] max-[600px]:flex-col max-[600px]:items-start">
          <span className="grid gap-[5px]">
            <small className="text-[9px] uppercase text-[var(--relay-text-muted)]">Status</small>
            <strong className="text-[11px]">Investigating</strong>
          </span>
          <span className="grid gap-[5px]">
            <small className="text-[9px] uppercase text-[var(--relay-text-muted)]">
              Acknowledge
            </small>
            <strong className="text-[11px] text-[var(--relay-success)]">Met in 3m</strong>
          </span>
          <span className="grid gap-[5px]">
            <small className="text-[9px] uppercase text-[var(--relay-text-muted)]">
              Resolve by
            </small>
            <strong className="text-[11px]">14:42 UTC</strong>
          </span>
        </div>
      </aside>
    </section>
  );
}
