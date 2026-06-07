/**
 * EMS Theme — single source of truth for all colors (light + dark).
 * CSS variables are injected in layout.tsx for both modes.
 * Charts use getChartGradients(mode) via useTheme().
 */
export type ColorMode = "light" | "dark";

export const THEME_STORAGE_KEY = "ems-color-mode";

const shared = {
  accent: "#e8a045",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  chartNet: "#e8a045",
  chartNetLight: "#fcd78a",
} as const;

export const lightTheme = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primaryDark: "#1e3a8a",
  primaryLight: "#eff6ff",
  primarySoft: "#dbeafe",
  primaryMuted: "#93c5fd",

  accent: shared.accent,
  accentDark: "#c4822a",
  accentLight: "#fff8ed",

  success: shared.success,
  successDark: "#047857",
  successLight: "#ecfdf5",
  successSoft: "#d1fae5",
  warning: shared.warning,
  warningLight: "#fffbeb",
  danger: shared.danger,
  dangerDark: "#b91c1c",
  dangerHover: "#dc2626",
  dangerLight: "#fef2f2",

  surface: "#ffffff",
  background: "#f4f8fc",
  foreground: "#0f172a",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",

  neutral50: "#f8fafc",
  neutral100: "#f1f5f9",
  neutral200: "#e2e8f0",
  neutral300: "#cbd5e1",
  neutral400: "#94a3b8",
  neutral500: "#64748b",
  neutral600: "#475569",
  neutral700: "#334155",
  neutral800: "#1e293b",
  neutral900: "#0f172a",

  chartGross: "#1e3a8a",
  chartGrossLight: "#60a5fa",
  chartNet: shared.chartNet,
  chartNetLight: shared.chartNetLight,
  chartDeductions: "#0284c7",
  chartDeductionsLight: "#7dd3fc",
  chartPieInactive: "#cbd5e1",
  chartPieInactiveLight: "#e2e8f0",
} as const;

export const darkTheme = {
  primary: "#60a5fa",
  primaryHover: "#93c5fd",
  primaryDark: "#3b82f6",
  primaryLight: "#1e3a5f",
  primarySoft: "#1e293b",
  primaryMuted: "#334155",

  accent: shared.accent,
  accentDark: "#fbbf24",
  accentLight: "#422006",

  success: "#34d399",
  successDark: "#10b981",
  successLight: "#064e3b",
  successSoft: "#065f46",
  warning: "#fbbf24",
  warningLight: "#451a03",
  danger: "#f87171",
  dangerDark: "#ef4444",
  dangerHover: "#fca5a5",
  dangerLight: "#450a0a",

  surface: "#1e293b",
  background: "#0f172a",
  foreground: "#f1f5f9",
  muted: "#94a3b8",
  mutedLight: "#64748b",
  border: "#334155",
  borderLight: "#1e293b",

  neutral50: "#0f172a",
  neutral100: "#1e293b",
  neutral200: "#334155",
  neutral300: "#475569",
  neutral400: "#64748b",
  neutral500: "#94a3b8",
  neutral600: "#cbd5e1",
  neutral700: "#e2e8f0",
  neutral800: "#f1f5f9",
  neutral900: "#f8fafc",

  chartGross: "#60a5fa",
  chartGrossLight: "#93c5fd",
  chartNet: shared.chartNet,
  chartNetLight: shared.chartNetLight,
  chartDeductions: "#38bdf8",
  chartDeductionsLight: "#7dd3fc",
  chartPieInactive: "#475569",
  chartPieInactiveLight: "#64748b",
} as const;

export type ThemeColorKey = keyof typeof lightTheme;
export type ThemeTokens = Record<ThemeColorKey, string>;

export const themes: Record<ColorMode, ThemeTokens> = {
  light: lightTheme,
  dark: darkTheme,
};

/** @deprecated Use getThemeTokens(mode) — kept for backwards compat */
export const theme = lightTheme;

export function getThemeTokens(mode: ColorMode): ThemeTokens {
  return themes[mode];
}

export function getChartColors(mode: ColorMode) {
  const t = getThemeTokens(mode);
  return {
    gross: t.chartGross,
    net: t.chartNet,
    deductions: t.chartDeductions,
    pieActive: t.primaryDark,
    pieInactive: t.chartPieInactive,
  } as const;
}

export function getChartGradients(mode: ColorMode) {
  const t = getThemeTokens(mode);
  return {
    gross: { from: t.chartGrossLight, to: t.chartGross },
    net: { from: t.chartNetLight, to: t.chartNet },
    deductions: { from: t.chartDeductionsLight, to: t.chartDeductions },
    pieActive: { from: t.chartGrossLight, to: t.primaryDark },
    pieInactive: { from: t.chartPieInactiveLight, to: t.chartPieInactive },
  } as const;
}

/** @deprecated Use getChartGradients(mode) */
export const chartGradients = getChartGradients("light");
/** @deprecated Use getChartColors(mode) */
export const chartColors = getChartColors("light");

function toCssVarName(key: string): string {
  if (/^neutral\d+$/.test(key)) {
    return `--ems-neutral-${key.replace("neutral", "")}`;
  }
  return `--ems-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
}

export function getThemeCssVariables(mode: ColorMode): string {
  return Object.entries(getThemeTokens(mode))
    .map(([key, value]) => `${toCssVarName(key)}: ${value};`)
    .join("\n  ");
}

/** Full stylesheet block for layout injection */
export function getThemeStylesheet(): string {
  return `:root {\n  ${getThemeCssVariables("light")}\n}\n[data-theme="dark"] {\n  ${getThemeCssVariables("dark")}\n}`;
}

export function getColorMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function themeColor(key: ThemeColorKey, mode?: ColorMode): string {
  const m = mode ?? getColorMode();
  if (typeof window !== "undefined") {
    const cssVar = toCssVarName(key);
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
    if (value) return value;
  }
  return getThemeTokens(m)[key];
}

/** Inline script — runs before paint to prevent flash */
export const themeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`;
