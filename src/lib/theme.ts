export type Theme = "dark" | "light";
export const themeStorageKey = "carwyn:theme";

// Trusted, constant bootstrap in <head>: no request data or runtime filesystem.
// Runs during HTML parsing, before CSS paints and before React hydrates.
export const themeBootstrap = `(function(){var t="dark";try{if(localStorage.getItem("${themeStorageKey}")==="light")t="light"}catch(e){}var r=document.documentElement;r.dataset.theme=t;r.classList.toggle("dark",t==="dark")})()`;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function getServerTheme(): Theme { return "dark"; }

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  document.dispatchEvent(new Event("carwyn:theme-change"));
}

export function restoreTheme() {
  let theme: Theme = "dark";
  try { if (localStorage.getItem(themeStorageKey) === "light") theme = "light"; } catch { /* Storage is optional. */ }
  applyTheme(theme);
}

export function subscribeTheme(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) restoreTheme();
  };
  document.addEventListener("carwyn:theme-change", listener);
  window.addEventListener("storage", storage);
  return () => {
    document.removeEventListener("carwyn:theme-change", listener);
    window.removeEventListener("storage", storage);
  };
}
