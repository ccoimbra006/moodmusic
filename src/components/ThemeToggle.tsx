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
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.setProperty("--bg-deep", "#f5f5fa");
      root.style.setProperty("--bg-mid", "#eaeaf0");
      root.style.setProperty("--text-primary", "#1a1a2e");
      root.style.setProperty("--text-secondary", "rgba(26,26,46,0.65)");
      root.style.setProperty("--text-muted", "rgba(26,26,46,0.4)");
      document.body.style.background = "#f5f5fa";
      document.body.style.color = "#1a1a2e";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.setProperty("--bg-deep", "#0a0a0f");
      root.style.setProperty("--bg-mid", "#12121a");
      root.style.setProperty("--text-primary", "#f0f0f0");
      root.style.setProperty("--text-secondary", "rgba(240,240,240,0.6)");
      root.style.setProperty("--text-muted", "rgba(240,240,240,0.4)");
      document.body.style.background = "#0a0a0f";
      document.body.style.color = "#f0f0f0";
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
        <Moon className="w-5 h-5" style={{ color: "#5b4fd8" }} />
      )}
    </button>
  );
}
