import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { Flame, Trophy, ArrowLeft, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { data: streaks } = trpc.streaks.leaderboard.useQuery();

  const getRankColor = (i: number) => {
    if (i === 0) return "#ffd60a";
    if (i === 1) return "#c0c0c0";
    if (i === 2) return "#cd7f32";
    return "var(--text-muted)";
  };

  const getRankIcon = (i: number) => {
    if (i === 0) return <Trophy className="w-5 h-5" style={{ color: "#ffd60a" }} />;
    if (i === 1) return <Medal className="w-5 h-5" style={{ color: "#c0c0c0" }} />;
    if (i === 2) return <Medal className="w-5 h-5" style={{ color: "#cd7f32" }} />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text-muted)" }}>#{i + 1}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Leaderboard</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>Os usuarios mais consistentes</p>

      <div className="space-y-3">
        {(streaks ?? []).map((s, i) => (
          <div
            key={s.userId}
            className="flex items-center gap-4 p-4 rounded-2xl transition-all"
            style={{
              background: i < 3 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${i < 3 ? getRankColor(i) + "30" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            <div className="w-8 flex justify-center">{getRankIcon(i)}</div>

            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: "var(--bg-mid)" }}>
              {s.avatar ? (
                <img src={s.avatar} alt={s.name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold">{(s.name || "?").charAt(0).toUpperCase()}</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{s.name || "Usuario"}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Recorde: {s.longestStreak} dias</div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: i === 0 ? "rgba(255,214,10,0.1)" : "rgba(255,79,216,0.1)",
                border: `1px solid ${i === 0 ? "rgba(255,214,10,0.2)" : "rgba(255,79,216,0.2)"}`,
              }}
            >
              <Flame className="w-4 h-4" style={{ color: i === 0 ? "#ffd60a" : "#ff4fd8" }} />
              <span className="text-sm font-bold">{s.currentStreak}</span>
            </div>
          </div>
        ))}
      </div>

      {(!streaks || streaks.length === 0) && (
        <div className="text-center py-12">
          <Flame className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          <p style={{ color: "var(--text-muted)" }}>Ainda ninguem tem uma racha. Seja o primeiro!</p>
        </div>
      )}
    </div>
  );
}
