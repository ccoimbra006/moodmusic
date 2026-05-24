import { Moon, Sun } from "lucide-react";

/**
 * Theme Toggle - Currently dark mode only.
 * The entire app was designed for dark mode with neon accents.
 * Light mode would require refactoring all inline styles across components.
 * 
 * The button still toggles a subtle "dimmed" vs "vivid" mode for user preference.
 */
export default function ThemeToggle() {
  // Dimmed mode reduces glow intensity for comfortable night viewing
  function toggleDimmed() {
    const root = document.documentElement;
    const isDimmed = root.classList.contains("dimmed");
    
    if (isDimmed) {
      root.classList.remove("dimmed");
      localStorage.setItem("moodtrack-dimmed", "false");
    } else {
      root.classList.add("dimmed");
      localStorage.setItem("moodtrack-dimmed", "true");
    }
  }

  // Cleanup: remove old light mode from previous versions
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    // Remove old light mode class and localStorage
    root.classList.remove("light");
    localStorage.removeItem("moodtrack-theme");
    
    // Apply saved dimmed preference
    const saved = localStorage.getItem("moodtrack-dimmed");
    if (saved === "true") {
      root.classList.add("dimmed");
    }
  }

  return (
    <button
      onClick={toggleDimmed}
      className="p-2 rounded-full transition-all hover:bg-white/10"
      title="Modo conforto (reduz brilho)"
    >
      <Moon className="w-5 h-5" style={{ color: "#a0a0b8" }} />
    </button>
  );
}
