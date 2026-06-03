import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { getMoodColors, ALL_MOODS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Sparkles, Disc3, Play, ExternalLink, Star, Eye,
  Loader2, Music, Users, Zap,
} from "lucide-react";

type Category = "all" | "famous" | "underground";

export default function Recommendations() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState("chill");
  const [category, setCategory] = useState<Category>("all");

  const { data: moodsData } = trpc.recommendations.moods.useQuery();
  const { data: recData, isLoading } = trpc.recommendations.byMood.useQuery(
    { mood: selectedMood, limit: 9 },
    { enabled: !!selectedMood }
  );

  const tracks = recData?.tracks ?? [];
  const filteredTracks = category === "all"
    ? tracks
    : tracks.filter((t) => t.artistCategory === category);

  const mc = getMoodColors(selectedMood);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})` }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Descobrir Musica</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Sugestoes baseadas no teu mood, com artistas famosos e underground
        </p>
      </div>

      {/* Mood selector */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: "var(--text-muted)" }}>
          Escolhe um mood
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_MOODS.map((m) => {
            const mmc = getMoodColors(m.key);
            const isActive = selectedMood === m.key;
            const count = moodsData?.find((md) => md.mood === m.key)?.total ?? 0;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: isActive ? `linear-gradient(135deg, ${mmc.color}, ${mmc.color2})` : "rgba(255,255,255,0.04)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isActive ? `0 4px 15px ${mmc.glow}` : "none",
                }}
              >
                {m.emoji} {m.label}
                {count > 0 && (
                  <span className="text-[10px] px-1 rounded-full" style={{ background: isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)", color: isActive ? "#fff" : "var(--text-muted)" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-8">
        {[
          { key: "all" as Category, label: "Todos", icon: <Zap className="w-3.5 h-3.5" /> },
          { key: "famous" as Category, label: "Famosos", icon: <Star className="w-3.5 h-3.5" /> },
          { key: "underground" as Category, label: "Underground", icon: <Eye className="w-3.5 h-3.5" /> },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: category === c.key ? `${mc.color}15` : "transparent",
              color: category === c.key ? mc.color : "var(--text-muted)",
              border: `1px solid ${category === c.key ? mc.color + "30" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: mc.color }} />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>A descobrir musicas...</span>
          </div>
        </div>
      )}

      {/* Tracks grid */}
      {!isLoading && filteredTracks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track, i) => (
            <Card
              key={`${track.id}-${i}`}
              className="overflow-hidden transition-all hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${track.artistCategory === "famous" ? mc.color + "20" : "rgba(255,255,255,0.08)"}`,
                boxShadow: track.artistCategory === "famous" ? `0 0 20px ${mc.glow}20` : "none",
              }}
            >
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                  {track.image ? (
                    <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-16 h-16" style={{ color: mc.color, opacity: 0.3 }} />
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: track.artistCategory === "famous" ? "rgba(255,214,10,0.15)" : "rgba(139,92,246,0.15)",
                        color: track.artistCategory === "famous" ? "#ffd60a" : "#8b5cf6",
                        border: `1px solid ${track.artistCategory === "famous" ? "rgba(255,214,10,0.3)" : "rgba(139,92,246,0.3)"}`,
                      }}
                    >
                      {track.artistCategory === "famous" ? "FAMOSO" : "UNDERGROUND"}
                    </span>
                  </div>
                  {/* Play overlay */}
                  {track.spotifyId && (
                    <a
                      href={`https://open.spotify.com/track/${track.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})` }}>
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </a>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{track.title}</h3>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{track.artist}</p>

                  {track.artistGenres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {track.artistGenres.slice(0, 3).map((g: string) => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${mc.color}10`, color: mc.color }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {track.spotifyUrl && (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}
                      >
                        <ExternalLink className="w-3 h-3" /> Spotify
                      </a>
                    )}
                    {track.album && (
                      <span className="text-[10px] px-2 py-1 rounded-full truncate max-w-[120px]" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                        {track.album}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredTracks.length === 0 && (
        <div className="text-center py-16">
          <Music className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          <p style={{ color: "var(--text-muted)" }}>Nenhuma sugestao encontrada para este filtro</p>
          <button onClick={() => setCategory("all")} className="text-sm mt-2 hover:underline" style={{ color: mc.color }}>
            Ver todos
          </button>
        </div>
      )}

      {/* Stats */}
      {moodsData && (
        <div className="mt-12 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-4 h-4" />, label: "Artistas", value: moodsData.reduce((s, m) => s + m.total, 0) },
              { icon: <Star className="w-4 h-4" />, label: "Famosos", value: moodsData.reduce((s, m) => s + (m.famous ?? 0), 0) },
              { icon: <Eye className="w-4 h-4" />, label: "Underground", value: moodsData.reduce((s, m) => s + (m.underground ?? 0), 0) },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex justify-center mb-1" style={{ color: mc.color }}>{s.icon}</div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
