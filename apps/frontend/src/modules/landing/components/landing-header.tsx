import { RelayLogo } from "@relayops/ui";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUiStore } from "@/stores/ui.store";
import { LandingActions } from "./landing-actions";

const navigation = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Architecture", href: "#architecture" }
];

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const nextTheme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const navLinkClass = [
    "border-b border-[var(--relay-border)] py-3.5 text-[13px] font-semibold no-underline",
    "!text-[var(--relay-text-secondary)] transition-colors hover:!text-[var(--relay-text)]",
    "focus-visible:!text-[var(--relay-text)] min-[901px]:border-0 min-[901px]:py-0"
  ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--relay-border)] bg-[color-mix(in_srgb,var(--relay-bg)_90%,transparent)] backdrop-blur-lg">
      <div className="mx-auto grid min-h-[70px] w-[calc(100%-48px)] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-7 max-[900px]:grid-cols-[1fr_auto] max-[600px]:w-[calc(100%-32px)]">
        <Link
          className="landing-brand w-fit !text-[var(--relay-text)] no-underline"
          to="/"
          aria-label="RelayOps home"
        >
          <RelayLogo />
        </Link>
        <nav className="flex gap-[30px] max-[900px]:hidden" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a className={navLinkClass} key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2.5">
          <button
            className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-full border border-[var(--relay-border)] bg-[color:var(--relay-surface)] px-3 text-xs text-[var(--relay-text-secondary)] capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--relay-accent)] max-[600px]:w-[38px] max-[600px]:justify-center max-[600px]:px-0"
            type="button"
            aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}
            onClick={() => setTheme(nextTheme)}
          >
            <span
              className="h-3 w-3 rounded-full border-[1.5px] border-current shadow-[inset_5px_0_currentColor]"
              aria-hidden="true"
            />
            <span className="max-[600px]:sr-only">{theme}</span>
          </button>
          <div className="max-[900px]:hidden">
            <LandingActions compact signedIn={signedIn} />
          </div>
          <button
            className="hidden h-10 w-10 cursor-pointer place-content-center gap-1.5 rounded-[10px] border border-[var(--relay-border)] bg-[color:var(--relay-surface)] text-[var(--relay-text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--relay-accent)] max-[900px]:grid"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="h-px w-[17px] bg-current" />
            <span className="h-px w-[17px] bg-current" />
          </button>
        </div>
      </div>
      <div
        id="landing-mobile-navigation"
        className={`hidden overflow-hidden border-t bg-[color:var(--relay-bg)] px-6 transition-[max-height,padding] duration-200 max-[900px]:grid ${
          menuOpen
            ? "max-h-[430px] border-[var(--relay-border)] py-[22px] pb-[26px]"
            : "max-h-0 border-transparent py-0"
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav className="grid" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <a
              className={navLinkClass}
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-5 [&_.landing-actions]:justify-start max-[600px]:[&_.landing-actions]:flex-col max-[600px]:[&_.landing-actions]:items-stretch">
          <LandingActions signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
