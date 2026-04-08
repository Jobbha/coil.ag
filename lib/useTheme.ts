"use client";

import { useCallback, useEffect, useState } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("coil-theme") as "dark" | "light" | null;
    if (saved) {
      setThemeState(saved);
      applyTheme(saved);
    }
  }, []);

  const setTheme = useCallback((t: "dark" | "light") => {
    // Add transition class, apply theme, then remove after transition completes
    document.documentElement.classList.add("theme-transition");
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("coil-theme", t);
    setTimeout(() => document.documentElement.classList.remove("theme-transition"), 400);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}
