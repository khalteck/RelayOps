import { createRelayTheme, relayPalettes, type ColorMode } from "@relayops/ui";
import { describe, expect, it } from "vitest";
import "../styles/theme-tokens.css";

const modes = ["light", "dark"] as const satisfies readonly ColorMode[];

const readablePairs = [
  ["text", "background"],
  ["text", "surface"],
  ["textSecondary", "surface"],
  ["textMuted", "surface"],
  ["accent", "surface"],
  ["accent", "accentMuted"],
  ["danger", "surface"],
  ["danger", "dangerMuted"],
  ["warning", "warningMuted"]
] as const;

function relativeLuminance(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? [...normalized].map((character) => `${character}${character}`).join("")
      : normalized;
  const channels = expanded.match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255);

  const [red, green, blue] = channels ?? [];

  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Unsupported test colour: ${hex}`);
  }

  const linearize = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return linearize(red) * 0.2126 + linearize(green) * 0.7152 + linearize(blue) * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe.each(modes)("the %s theme contract", (mode) => {
  const palette = relayPalettes[mode];

  it.each(readablePairs)("%s remains readable on %s", (foreground, background) => {
    expect(contrastRatio(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary button text readable", () => {
    expect(contrastRatio("#ffffff", palette.solidAccent)).toBeGreaterThanOrEqual(4.5);
  });

  it("gives Ant Design explicit matching surface and text tokens", () => {
    const tokens = createRelayTheme(mode).token;

    expect(tokens).toMatchObject({
      colorBgContainer: palette.surface,
      colorBgLayout: palette.background,
      colorBorder: palette.border,
      colorText: palette.text,
      colorTextSecondary: palette.textSecondary
    });
  });

  it("keeps the CSS palette synchronized with the component palette", () => {
    document.documentElement.dataset.theme = mode;
    const styles = getComputedStyle(document.documentElement);

    expect(styles.getPropertyValue("--relay-bg").trim()).toBe(palette.background);
    expect(styles.getPropertyValue("--relay-surface").trim()).toBe(palette.surface);
    expect(styles.getPropertyValue("--relay-text").trim()).toBe(palette.text);
    expect(styles.getPropertyValue("--relay-text-secondary").trim()).toBe(palette.textSecondary);
    expect(styles.getPropertyValue("--relay-accent-muted").trim()).toBe(palette.accentMuted);
  });
});
