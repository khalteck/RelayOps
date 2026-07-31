import type { ThemeConfig } from "antd";
import { theme } from "antd";

export type ColorMode = "light" | "dark";

/**
 * RelayOps owns these semantic colours instead of depending on Ant Design's
 * internal CSS variable names. Custom CSS and Ant components therefore share
 * one explicit, testable foreground/background contract in every colour mode.
 */
export const relayPalettes = {
  light: {
    background: "#f7f7f5",
    surface: "#ffffff",
    surfaceMuted: "#f1f1ee",
    text: "#24252b",
    textSecondary: "#62646d",
    textMuted: "#6f717a",
    border: "#d9dad5",
    accent: "#5b50df",
    accentMuted: "#eeedff",
    solidAccent: "#5b50df",
    danger: "#c7374a",
    dangerMuted: "#fff0f2",
    warning: "#925007",
    warningMuted: "#fff4e5",
    success: "#14785f"
  },
  dark: {
    background: "#101114",
    surface: "#17181d",
    surfaceMuted: "#202228",
    text: "#f4f4f5",
    textSecondary: "#b9bbc3",
    textMuted: "#9b9da6",
    border: "#34363f",
    accent: "#aaa5ff",
    accentMuted: "#2a2747",
    solidAccent: "#5b50df",
    danger: "#ff7d8c",
    dangerMuted: "#3a2027",
    warning: "#ffc171",
    warningMuted: "#382a19",
    success: "#63d7b3"
  }
} as const;

export function createRelayTheme(mode: ColorMode): ThemeConfig {
  const palette = relayPalettes[mode];

  return {
    algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: palette.solidAccent,
      colorInfo: palette.solidAccent,
      colorSuccess: palette.success,
      colorWarning: palette.warning,
      colorError: palette.danger,
      colorLink: palette.accent,
      colorLinkActive: palette.accent,
      colorLinkHover: palette.accent,
      colorText: palette.text,
      colorTextHeading: palette.text,
      colorTextLabel: palette.text,
      colorTextDescription: palette.textSecondary,
      colorTextSecondary: palette.textSecondary,
      colorTextTertiary: palette.textMuted,
      colorBgBase: palette.background,
      colorBgLayout: palette.background,
      colorBgContainer: palette.surface,
      colorBgElevated: palette.surface,
      colorFillQuaternary: palette.surfaceMuted,
      colorBorder: palette.border,
      colorBorderSecondary: palette.border,
      borderRadius: 10,
      borderRadiusLG: 14,
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      controlHeight: 38
    },
    components: {
      Button: { fontWeight: 600, primaryColor: "#ffffff", primaryShadow: "none" },
      Card: { boxShadowTertiary: "none" },
      Layout: {
        bodyBg: palette.background,
        siderBg: palette.surface
      },
      Menu: {
        itemBorderRadius: 8,
        itemHeight: 38,
        itemMarginInline: 8
      },
      Table: {
        headerBg: palette.surfaceMuted,
        headerColor: palette.textSecondary
      }
    }
  };
}
