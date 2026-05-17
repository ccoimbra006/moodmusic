import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { FollowButton } from "@/components/FollowButton";
import { getMoodColors } from "@/lib/moods";
import {
  ArrowLeft, Music, Heart, Calendar, BarChart3, Users, UserPlus, TrendingUp
} from "lucide-react";

const ALL_MOODS = [
  { key: "chill", label: "Chill", emoji: "\uD83C\uDF43" },
  { key: "energy", label: "Energia", emoji: "\u26A1" },
  { key: "happy", label: "Feliz", emoji: "\u2600\uFE0F" },
  { key: "melancholy", label: "Melancolia", emoji: "\uD83C\uDF19" },
  { key: "romantic", label: "Romantico", emoji: "\uD83D\uDC9C" },
  { key: "focus", label: "Foco", emoji: "\uD83C\uDFAF" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams<{ userId?: string }>();
  const { user: me, logout } = useAuth();

  const profileUserId = userIdParam ? Number(userIdParam) : me?.id;
  const isMyProfile = me?.id === profileUserId;

  const { data: profileUser } = trpc.users.getById.useQuery(
    { id: profileUserId! },
    { enabled: !!profileUserId }
  );

  const { data: followCounts } = trpc.follows.getFollowCounts.useQuery(
    { userId: profileUserId! },
    { enabled: !!profileUserId }
  );

  const { data: saddestWeek } = trpc.timeline.saddestWeek.useQuery(undefined, {
    enabled: isMyProfile && !!me,
  });

  const { data: mostEnergy } = trpc.timeline.mostEnergeticMonth.useQuery(undefined, {
    enabled: isMyProfile && !!me,
  });

  const { data: favorites } = trpc.favorites.getMyFavorites.useQuery(undefined, {
    enabled: isMyProfile && !!me,
  });

  const { data: moodStats } = trpc.timeline.moodStats.useQuery(undefined, {
    enabled: isMyProfile && !!me,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "favorites" | "stats">("overview");

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>Utilizador nao encontrado</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm underline" style={{ color: "#1DB954" }}>Voltar</button>
        </div>
      </div>
    );
  }

  const mostListenedMood = moodStats && moodStats.length > 0 ? moodStats[0].mood : null;
  const mostListenedCount = moodStats && moodStats.length > 0 ? moodStats[0].count : 0;
  const mc = getMoodColors(mostListenedMood ?? "chill");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: "rgba(10,10,15,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          {isMyProfile && (
            <button
              onClick={logout}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              Sair
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Profile Card */}
        <div className="rounded-[20px] p-6" style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})` }}>
              {profileUser.avatar ? (
                <img src={profileUser.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                (profileUser.name ?? "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{profileUser.name || "Utilizador"}</h1>
              <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{profileUser.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {followCounts?.followers ?? 0} seguidores
                </span>
                <span className="flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> {followCounts?.following ?? 0} seguindo
                </span>
              </div>
            </div>
            {!isMyProfile && profileUserId && (
              <FollowButton userId={profileUserId} />
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            {(["overview", "favorites", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                style={{
                  background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
                  color: activeTab === tab ? "#fff" : "var(--text-muted)",
                }}
              >
                {tab === "overview" ? "Visao Geral" : tab === "favorites" ? "Favoritos" : "Estatisticas"}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* Most Listened Mood */}
            <div className="rounded-[20px] p-6" style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" style={{ color: mc.color }} />
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Mais Ouvido</h2>
              </div>
              {mostListenedMood ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 0 20px ${mc.glow}` }}>
                    {ALL_MOODS.find((m) => m.key === mostListenedMood)?.emoji}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{ALL_MOODS.find((m) => m.key === mostListenedMood)?.label}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{mostListenedCount} vezes ouvido</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum mood registado ainda</p>
              )}
            </div>

            {/* Mood Distribution */}
            {moodStats && moodStats.length > 0 && (
              <div className="rounded-[20px] p-6" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" style={{ color: mc.color }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Distribuicao de Moods</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {moodStats.map((stat: { mood: string; count: number }) => {
                    const moodData = ALL_MOODS.find((m) => m.key === stat.mood);
                    const maxCount = moodStats[0].count;
                    const pct = Math.round((stat.count / maxCount) * 100);
                    const smc = getMoodColors(stat.mood);
                    return (
                      <div key={stat.mood} className="flex items-center gap-3">
                        <span className="text-lg w-8">{moodData?.emoji}</span>
                        <span className="text-xs font-bold w-20" style={{ color: "var(--text-secondary)" }}>{moodData?.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${smc.color}, ${smc.color2})`,
                          }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--text-muted)" }}>{stat.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Emotional Highlights */}
            {(saddestWeek || mostEnergy) && (
              <div className="rounded-[20px] p-6" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4" style={{ color: mc.color }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Destaques Emocionais</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {saddestWeek && saddestWeek.count > 0 && (
                    <div className="rounded-xl p-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>Semana mais triste</p>
                      <p className="text-sm font-bold text-white mt-1">{saddestWeek.week}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{saddestWeek.count} melancolias</p>
                    </div>
                  )}
                  {mostEnergy && mostEnergy.count > 0 && (
                    <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f59e0b" }}>Mes mais energico</p>
                      <p className="text-sm font-bold text-white mt-1">{mostEnergy.month}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{mostEnergy.count} energias</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="rounded-[20px] p-6" style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4" style={{ color: "#ec4899" }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Favoritos</h2>
            </div>
            {favorites && favorites.length > 0 ? (
              <div className="flex flex-col gap-3">
                {favorites.map((fav: { id: number; title: string; artist: string; image: string | null }) => (
                  <div key={fav.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <img src={fav.image ?? ""} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{fav.title}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{fav.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum favorito ainda</p>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="rounded-[20px] p-6" style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-4 h-4" style={{ color: mc.color }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Estatisticas</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold" style={{ color: mc.color }}>{favorites?.length ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>Favoritos</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold" style={{ color: mc.color }}>{followCounts?.followers ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>Seguidores</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold" style={{ color: mc.color }}>{followCounts?.following ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>Seguindo</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold" style={{ color: mc.color }}>{moodStats?.length ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>Moods diferentes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
