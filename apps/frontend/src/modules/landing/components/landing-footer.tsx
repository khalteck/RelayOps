import { RelayLogo } from "@relayops/ui";
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--relay-border)] bg-[color:var(--relay-surface)]">
      <div className="mx-auto grid min-h-[150px] w-[calc(100%-48px)] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-[30px] max-[900px]:grid-cols-[1fr_auto] max-[600px]:w-[calc(100%-32px)] max-[600px]:grid-cols-1 max-[600px]:py-[34px]">
        <Link
          className="landing-brand w-fit !text-[var(--relay-text)] no-underline"
          to="/"
          aria-label="RelayOps home"
        >
          <RelayLogo />
        </Link>
        <p className="text-xs text-[var(--relay-text-secondary)] max-[900px]:col-span-full max-[900px]:col-start-1 max-[900px]:row-start-2 max-[900px]:mb-7 max-[600px]:col-auto max-[600px]:row-auto max-[600px]:m-0">
          RelayOps — designed and built by{" "}
          <a
            className="font-bold !text-[var(--relay-text)]"
            href="https://khalidoyeneye.dev"
            target="_blank"
            rel="noreferrer"
          >
            Khalid Oyeneye
          </a>
          .
        </p>
        <span className="justify-self-end text-xs text-[var(--relay-text-muted)] max-[600px]:justify-self-start">
          Incident coordination, without the noise.
        </span>
      </div>
    </footer>
  );
}
