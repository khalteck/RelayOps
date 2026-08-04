import { useColorMode } from "@/hooks/use-color-mode";
import { dashboardDarkImage, dashboardLightImage } from "../product-art";
import { ProductWindow } from "./product-window";

export function HeroProduct() {
  const colorMode = useColorMode();
  const source = colorMode === "dark" ? dashboardDarkImage : dashboardLightImage;

  return (
    <div
      className="landing-product-stage relative translate-y-6 rounded-t-[26px] border border-b-0 border-[var(--relay-border)] bg-[color:var(--relay-surface-muted)] p-[13px] pb-0 opacity-0 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100"
      data-reveal
    >
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-2/5 w-2/5 rounded-full bg-[#ef6b722b] blur-3xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-0 top-0 h-2/5 w-2/5 rounded-full bg-[#665cf62e] blur-3xl"
        aria-hidden="true"
      />
      <ProductWindow
        eager
        src={source}
        title="relayops / relay-labs / platform"
        alt={`RelayOps operational dashboard in ${colorMode} mode`}
        variant="hero"
      />
      <div
        className="absolute bottom-[30px] left-[-22px] z-[3] flex min-w-[380px] items-center gap-3 rounded-[13px] border border-black/10 bg-white/95 px-4 py-3.5 text-[#24252b] shadow-[0_18px_60px_rgb(33_28_70/15%)] backdrop-blur-md max-[600px]:inset-x-[10px] max-[600px]:bottom-[18px] max-[600px]:min-w-0"
        aria-hidden="true"
      >
        <span className="h-[9px] w-[9px] shrink-0 animate-pulse rounded-full bg-[#ef6b72] shadow-[0_0_0_6px_rgb(239_107_114/13%)] motion-reduce:animate-none" />
        <div>
          <small className="mb-[3px] block text-[10px] text-[#6f717a]">Platform API · P1</small>
          <strong className="block text-[13px]">Investigating elevated latency</strong>
        </div>
        <span className="ml-auto rounded-md bg-[#e7f7f1] px-[7px] py-1 text-[10px] font-bold text-[#14785f]">
          Live
        </span>
      </div>
      <div
        className="absolute right-[-18px] top-[92px] z-[3] grid min-w-[158px] gap-1 rounded-[13px] border border-black/10 bg-white/95 px-4 py-3.5 text-[#24252b] shadow-[0_18px_60px_rgb(33_28_70/15%)] backdrop-blur-md max-[600px]:hidden"
        aria-hidden="true"
      >
        <small className="block text-[10px] text-[#6f717a]">Resolution SLA</small>
        <strong className="block text-xl tabular-nums">00:42:18</strong>
        <span className="text-[10px] font-bold text-[#14785f]">On track</span>
      </div>
    </div>
  );
}
