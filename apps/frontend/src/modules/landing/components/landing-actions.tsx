import { Link } from "react-router-dom";

export function LandingActions({
  signedIn,
  compact = false
}: {
  signedIn: boolean;
  compact?: boolean;
}) {
  const groupClass = "landing-actions flex items-center justify-end gap-2.5";
  const buttonClass = [
    "landing-button inline-flex items-center justify-center gap-2 rounded-[9px] border text-[13px]",
    "font-bold no-underline transition-[transform,background-color,border-color] duration-200",
    "hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-[var(--relay-accent)] motion-reduce:transform-none",
    compact ? "min-h-9 px-3.5" : "min-h-10 px-[17px]"
  ].join(" ");
  const primaryClass = `${buttonClass} border-transparent !bg-[color:var(--relay-accent-solid)] !text-[var(--relay-on-accent)] hover:!bg-[color:var(--relay-accent-solid)] visited:!text-[var(--relay-on-accent)]`;
  const quietClass = `${buttonClass} border-[var(--relay-border)] !bg-[color:var(--relay-surface)] !text-[var(--relay-text)] visited:!text-[var(--relay-text)]`;

  if (signedIn) {
    return (
      <div className={groupClass}>
        <Link className={primaryClass} to="/app">
          Open dashboard <span aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={groupClass}>
      <Link className={`${quietClass} landing-button--quiet`} to="/login">
        Sign in
      </Link>
      <Link className={primaryClass} to="/register">
        Create workspace <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
