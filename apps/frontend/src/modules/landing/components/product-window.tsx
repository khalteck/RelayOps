import type { ReactNode } from "react";

export function ProductWindow({
  src,
  alt,
  title,
  eager = false,
  variant = "hero",
  children
}: {
  src: string;
  alt: string;
  title: string;
  eager?: boolean;
  variant?: "hero" | "feature" | "analytics";
  children?: ReactNode;
}) {
  const figureVariant = {
    hero: "rounded-t-[17px]",
    feature: "rounded-[18px]",
    analytics: "rounded-[17px] rotate-[1.6deg] hover:rotate-[0.6deg] motion-reduce:rotate-0"
  }[variant];
  const viewportVariant = {
    hero: "h-[clamp(420px,57vw,685px)] max-[600px]:h-[480px]",
    feature: "h-[clamp(410px,53vw,680px)] max-[600px]:h-[480px]",
    analytics: "h-[490px] max-[600px]:h-[430px]"
  }[variant];
  const imageVariant = {
    hero: "h-full min-w-[920px] object-cover object-left-top max-[600px]:min-w-[850px]",
    feature:
      "h-full min-w-[980px] object-cover object-top max-[600px]:min-w-[930px] max-[600px]:object-right-top",
    analytics: "h-full min-w-[870px] object-cover object-left-top max-[600px]:min-w-[760px]"
  }[variant];

  return (
    <figure
      className={`product-window group relative m-0 overflow-hidden border border-[var(--relay-border)] bg-[color:var(--relay-surface)] shadow-[0_34px_90px_rgb(28_25_48/15%)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_42px_100px_rgb(28_25_48/18%)] motion-reduce:transform-none ${figureVariant}`}
    >
      <div
        className="grid min-h-[43px] grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[var(--relay-border)] bg-[color:var(--relay-surface)] px-4 font-mono text-[10px] font-semibold text-[var(--relay-text-muted)] max-[600px]:grid-cols-[auto_1fr]"
        aria-hidden="true"
      >
        <span className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#ef6b72]" />
          <i className="h-2 w-2 rounded-full bg-[#f3a953]" />
          <i className="h-2 w-2 rounded-full bg-[#65bd8b]" />
        </span>
        <span className="max-[600px]:truncate">{title}</span>
        <span className="justify-self-end max-[600px]:hidden">Secure</span>
      </div>
      <div className={`overflow-hidden bg-[#f7f7f5] ${viewportVariant}`}>
        <img
          className={`block w-full ${imageVariant}`}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
        />
      </div>
      {children}
    </figure>
  );
}
