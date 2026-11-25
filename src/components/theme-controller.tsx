import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

export function ThemeController({ initialTheme }: { initialTheme: "light" | "dark" }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    let active = true;
    const admin = pathname.startsWith("/admin");
    const apply = (theme: string) => {
      document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", theme === "light" ? "#ffffff" : "#0a0708");
    };
    const refresh = async () => {
      if (admin) {
        try {
          apply(localStorage.getItem("admin_theme") || "dark");
        } catch {
          apply("dark");
        }
        return;
      }
      try {
        const response = await fetch("/api/content", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) apply(data.site?.theme === "light" ? "light" : "dark");
      } catch {
        /* Retain the server-rendered theme when offline. */
      }
    };
    apply(initialTheme);
    void refresh();
    const timer = admin
      ? undefined
      : window.setInterval(() => {
          if (!document.hidden) void refresh();
        }, 15000);
    window.addEventListener("admin-theme-change", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("admin-theme-change", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname, initialTheme]);
  return null;
}
