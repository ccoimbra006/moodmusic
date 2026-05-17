export const MOOD_COLORS: Record<string, { color: string; glow: string; color2: string }> = {
  chill: {
    color: "#00ff9d",
    glow: "rgba(0,255,157,0.35)",
    color2: "#00c3ff",
  },
  energy: {
    color: "#ff7b00",
    glow: "rgba(255,80,0,0.45)",
    color2: "#ff003c",
  },
  happy: {
    color: "#ffd60a",
    glow: "rgba(255,214,10,0.35)",
    color2: "#ff9f1c",
  },
  melancholy: {
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.4)",
    color2: "#4c1d95",
  },
  romantic: {
    color: "#ff4fd8",
    glow: "rgba(255,79,216,0.35)",
    color2: "#c084fc",
  },
  focus: {
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.35)",
    color2: "#0066ff",
  },
};

export function getMoodColors(mood: string) {
  return MOOD_COLORS[mood] ?? MOOD_COLORS.chill;
}

export function setGlobalMood(mood: string) {
  localStorage.setItem("moodtrack_current_mood", mood);
  window.dispatchEvent(new CustomEvent("moodchange", { detail: { mood } }));
}

export const ALL_MOODS = [
  { key: "happy",      emoji: "\u2600\uFE0F", label: "Feliz" },
  { key: "chill",      emoji: "\uD83C\uDF43", label: "Chill" },
  { key: "energy",     emoji: "\u26A1",    label: "Energia" },
  { key: "melancholy", emoji: "\uD83C\uDF19",    label: "Melancolia" },
  { key: "romantic",   emoji: "\uD83D\uDC9C",    label: "Romantico" },
  { key: "focus",      emoji: "\uD83C\uDFAF",    label: "Foco" },
];
