"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors duration-300 active:scale-95"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-primary">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
};
