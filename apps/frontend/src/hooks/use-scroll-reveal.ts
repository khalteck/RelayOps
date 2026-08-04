import { useEffect, type RefObject } from "react";

export function useScrollReveal(container: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = container.current;
    if (!root) return;

    const elements = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = (element: HTMLElement) => {
      element.classList.remove("translate-y-6", "opacity-0");
      element.classList.add("translate-y-0", "opacity-100");
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [container]);
}
