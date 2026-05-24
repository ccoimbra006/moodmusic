import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("moodtrack-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "light") {
      root.style.setProperty("--bg-base", "#f0f0f5");
      root.style.setProperty("--bg-mid", "#e4e4ea");
      root.style.setProperty("--bg-card", "rgba(255,255,255,0.8)");
      root.style.setProperty("--text-primary", "#1a1a2e");
      root.style.setProperty("--text-secondary", "#444466");
      root.style.setProperty("--text-muted", "#8888aa");
      root.style.setProperty("--glass-border", "rgba(0,0,0,0.08)");
      document.body.style.background = "#f0f0f5";
      document.body.style.color = "#1a1a2e";
    } else {
      root.style.setProperty("--bg-base", "#06060a");
      root.style.setProperty("--bg-mid", "#0e0e14");
      root.style.setProperty("--bg-card", "rgba(255,255,255,0.04)");
      root.style.setProperty("--text-primary", "#e8e8f0");
      root.style.setProperty("--text-secondary", "#a0a0b8");
      root.style.setProperty("--text-muted", "#606070");
      root.style.setProperty("--glass-border", "rgba(255,255,255,0.06)");
      document.body.style.background = "#06060a";
      document.body.style.color = "#e8e8f0";
    }
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("moodtrack-theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full transition-all hover:bg-white/10"
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" style={{ color: "#ffd60a" }} />
      ) : (
        <Moon className="w-5 h-5" style={{ color: "#8b5cf6" }} />
      )}
    </button>
  );
}
