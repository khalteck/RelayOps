import { useEffect, useRef } from "react";
import { useSession } from "@/modules/auth";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { ArchitectureSection } from "../components/architecture-section";
import { FeatureShowcase } from "../components/feature-showcase";
import { HeroProduct } from "../components/hero-product";
import { LandingActions } from "../components/landing-actions";
import { LandingFooter } from "../components/landing-footer";
import { LandingHeader } from "../components/landing-header";
import { WorkflowSection } from "../components/workflow-section";

const foundations = [
  [
    "01",
    "Multi-tenant context",
    "Switch organisations and workspaces without losing operational focus."
  ],
  [
    "02",
    "SLA visibility",
    "See acknowledgement and resolution pressure before a deadline becomes a breach."
  ],
  [
    "03",
    "Realtime alignment",
    "Receive committed workspace changes without duplicate or stale revisions."
  ],
  ["04", "Audit-ready history", "Keep permissions, actions, and incident decisions traceable."]
] as const;

export function Component() {
  const page = useRef<HTMLDivElement>(null);
  const session = useSession();
  const signedIn = Boolean(session.data?.user);
  useScrollReveal(page);

  useEffect(() => {
    const previousTitle = document.title;
    const documentRoot = document.documentElement;
    document.title = "RelayOps — Incident coordination, without the noise";
    documentRoot.classList.add("scroll-smooth");
    return () => {
      document.title = previousTitle;
      documentRoot.classList.remove("scroll-smooth");
    };
  }, []);

  return (
    <div
      ref={page}
      className="landing-page relative isolate min-h-screen overflow-clip bg-[color:var(--relay-bg)] text-[var(--relay-text)]"
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-px bg-[color:var(--relay-border)] opacity-30"
        aria-hidden="true"
      />
      <a className="skip-link" href="#landing-content">
        Skip to main content
      </a>
      <LandingHeader signedIn={signedIn} />
      <main className="relative z-10" id="landing-content">
        <section className="mx-auto grid min-h-[610px] w-[calc(100%-48px)] max-w-[1240px] grid-cols-[minmax(0,1fr)_210px] items-center gap-[60px] py-[94px] pb-28 max-[900px]:min-h-0 max-[900px]:grid-cols-1 max-[900px]:py-20 max-[900px]:pb-[120px] max-[600px]:w-[calc(100%-32px)] max-[600px]:py-16 max-[600px]:pb-24">
          <div
            className="landing-hero__copy max-w-[940px] translate-y-6 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100"
            data-reveal
          >
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--relay-accent)]">
              Incident coordination, without the noise
            </p>
            <h1 className="mb-7 mt-6 max-w-[960px] text-[clamp(54px,7.4vw,102px)] leading-[0.94] tracking-[-0.072em] max-[600px]:text-[clamp(48px,15vw,68px)]">
              Keep every response moving in the same direction.
            </h1>
            <p className="mb-[30px] mt-0 max-w-[680px] text-[clamp(17px,2vw,21px)] leading-[1.65] text-[var(--relay-text-secondary)] max-[600px]:text-base">
              A calm operating space for distributed teams to own incidents, protect service
              commitments, and preserve the decisions that move recovery forward.
            </p>
            <div className="[&_.landing-actions]:justify-start max-[600px]:[&_.landing-actions]:flex-col max-[600px]:[&_.landing-actions]:items-stretch max-[600px]:[&_.landing-button]:w-full">
              <LandingActions signedIn={signedIn} />
            </div>
            <a
              className="mt-6 inline-flex w-fit gap-2.5 text-[13px] !text-[var(--relay-text-secondary)] no-underline"
              href="#workflow"
            >
              Follow the response workflow <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div
            className="mb-20 grid self-end border-t border-[var(--relay-border)] max-[900px]:hidden"
            aria-label="RelayOps product principles"
          >
            <span className="border-b border-[var(--relay-border)] py-3 text-xs text-[var(--relay-text-secondary)]">
              Clear owner
            </span>
            <span className="border-b border-[var(--relay-border)] py-3 text-xs text-[var(--relay-text-secondary)]">
              Visible deadline
            </span>
            <span className="border-b border-[var(--relay-border)] py-3 text-xs text-[var(--relay-text-secondary)]">
              Shared record
            </span>
          </div>
        </section>
        <div className="relative z-[2] mx-auto -mt-[60px] w-[calc(100%-48px)] max-w-[1240px] max-[600px]:-mt-11 max-[600px]:w-[calc(100%-16px)]">
          <HeroProduct />
        </div>
        <section
          className="mx-auto grid w-[calc(100%-48px)] max-w-[1240px] grid-cols-4 border-l border-t border-[var(--relay-border)] max-[900px]:grid-cols-2 max-[600px]:w-full max-[600px]:grid-cols-1 max-[600px]:border-l-0"
          aria-label="Product foundations"
        >
          {foundations.map(([number, title, description]) => (
            <article
              className="min-h-[220px] translate-y-6 border-b border-r border-[var(--relay-border)] p-7 py-9 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 max-[600px]:min-h-[180px]"
              key={number}
              data-reveal
            >
              <span className="font-mono text-[11px] font-semibold leading-none text-[var(--relay-text-muted)]">
                {number}
              </span>
              <h2 className="mb-2.5 mt-[54px] text-lg tracking-[-0.025em] max-[600px]:mt-[34px]">
                {title}
              </h2>
              <p className="leading-[1.65] text-[var(--relay-text-secondary)]">{description}</p>
            </article>
          ))}
        </section>
        <WorkflowSection />
        <FeatureShowcase />
        <ArchitectureSection />
        <section
          className="mx-auto w-[calc(100%-48px)] max-w-[1240px] translate-y-6 py-40 text-center opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 max-[600px]:w-[calc(100%-32px)] max-[600px]:py-[100px]"
          data-reveal
        >
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--relay-accent)]">
            A better place to run the response
          </p>
          <h2 className="mx-auto my-[18px] mb-6 max-w-[850px] text-[clamp(38px,5.2vw,68px)] leading-[1.02] tracking-[-0.06em] max-[600px]:text-[40px]">
            When the signal matters, keep the work together.
          </h2>
          <p className="mx-auto mb-7 max-w-[610px] text-[17px] leading-[1.65] text-[var(--relay-text-secondary)]">
            Start a workspace for your team or return to the operational context already in motion.
          </p>
          <div className="[&_.landing-actions]:justify-center">
            <LandingActions signedIn={signedIn} />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
