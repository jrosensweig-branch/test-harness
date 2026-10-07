export const THEMES = [
  {
    id: "light",
    label: "Light",
    tagline: "Airy, calm, daylight-ready",
  },
  {
    id: "dark",
    label: "Dark",
    tagline: "Glass panels over a slow aurora",
  },
  {
    id: "synthwave",
    label: "Synthwave",
    tagline: "Neon horizon, chrome type, 1986 forever",
  },
  {
    id: "crt",
    label: "CRT",
    tagline: "Green phosphor, scanlines, blinking cursor",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";
export const THEME_STORAGE_KEY = "harness-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/**
 * Runs before hydration so the first paint already wears the saved theme.
 * Kept as a plain string because it is injected into <head> verbatim.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var ok=${JSON.stringify(
  THEMES.map((theme) => theme.id),
)};document.documentElement.dataset.theme=ok.indexOf(t)>-1?t:"${DEFAULT_THEME}";}catch(e){document.documentElement.dataset.theme="${DEFAULT_THEME}";}})();`;
