import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { getMoodColors, ALL_MOODS } from "@/lib/moods";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music, Filter, ArrowLeft, Disc3 } from "lucide-react";

export default function Explore() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);

  const { data: history } = trpc.songs.getHistory.useQuery();

  const filtered = (history ?? []).filter((song) => {
    const matchesQuery = !query ||
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase());
    const matchesMood = !moodFilter || song.detectedMood === moodFilter;
    return matchesQuery && matchesMood;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-20">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-6">Explorar</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar musica ou artista..."
          className="flex-1 bg-white/5 h-12 rounded-xl text-white placeholder:text-white/30"
        />
      </div>

      {/* Mood filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setMoodFilter(null)}
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          style={{
            borderColor: !moodFilter ? "#fff" : "rgba(255,255,255,0.2)",
            background: !moodFilter ? "rgba(255,255,255,0.15)" : "transparent",
          }}
        >
          <Filter className="w-3 h-3 mr-1" />
          Todos
        </Button>
        {ALL_MOODS.map((m) => {
          const mc = getMoodColors(m.key);
          return (
            <Button
              key={m.key}
              onClick={() => setMoodFilter(moodFilter === m.key ? null : m.key)}
              variant="outline"
              size="sm"
              className="rounded-full text-xs transition-all"
              style={{
                borderColor: moodFilter === m.key ? mc.color : "rgba(255,255,255,0.2)",
                background: moodFilter === m.key ? `${mc.color}15` : "transparent",
                color: moodFilter === m.key ? mc.color : "var(--text-secondary)",
              }}
            >
              {m.emoji} {m.label}
            </Button>
          );
        })}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((song) => {
          const mc = getMoodColors(song.detectedMood);
          return (
            <div
              key={song.id}
              onClick={() => navigate(`/?song=${song.id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:translate-x-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--bg-mid)" }}>
                {song.image ? (
                  <img src={song.image} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-6 h-6" style={{ color: mc.color }} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{song.title}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{song.artist}</div>
                {song.detectedMood && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${mc.color}15`, color: mc.color }}>
                    {song.detectedMood}
                  </span>
                )}
              </div>
              <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                {song.date ? new Date(song.date).toLocaleDateString("pt-PT") : ""}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          <p style={{ color: "var(--text-muted)" }}>Nenhuma musica encontrada</p>
        </div>
      )}
    </div>
  );
}
