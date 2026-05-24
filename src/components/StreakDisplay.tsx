import { useStreak } from "@/hooks/useStreak";
import { Flame } from "lucide-react";

export default function StreakDisplay() {
  const { currentStreak } = useStreak();

  if (currentStreak <= 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
      style={{
        background: currentStreak >= 7 ? "rgba(255,123,0,0.15)" : "rgba(255,0,0,0.1)",
        color: currentStreak >= 7 ? "#ff7b00" : "#ff4fd8",
        border: currentStreak >= 7 ? "1px solid rgba(255,123,0,0.3)" : "1px solid rgba(255,79,216,0.2)",
      }}
    >
      <Flame className="w-3.5 h-3.5" />
      {currentStreak} dia{currentStreak > 1 ? "s" : ""}
    </div>
  );
}
