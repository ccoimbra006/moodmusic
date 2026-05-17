import { useState, useEffect } from "react";

export function useCurrentMood(): string {
  const [mood, setMood] = useState(() => {
    return localStorage.getItem("moodtrack_current_mood") || "chill";
  });

  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (e.key === "moodtrack_current_mood" && e.newValue) {
        setMood(e.newValue);
      }
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);

  useEffect(() => {
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.mood) setMood(detail.mood);
    };
    window.addEventListener("moodchange", handleCustom);
    return () => window.removeEventListener("moodchange", handleCustom);
  }, []);

  return mood;
}
