import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentMood } from "@/hooks/useMood";
import { getMoodColors } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Plus, ArrowLeft, Music, Loader2, Crown } from "lucide-react";

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  image?: string;
  spotifyUrl: string;
  previewUrl?: string | null;
}

export default function Admin() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const currentMood = useCurrentMood();
  const mc = getMoodColors(currentMood);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const searchSpotify = trpc.spotify.search.useMutation({
    onSuccess: (data) => { setResults(data.tracks); setSearching(false); },
    onError: () => { toast.error("Erro ao buscar no Spotify"); setSearching(false); },
  });

  const publishSong = trpc.songs.create.useMutation({
    onSuccess: () => {
      utils.songs.getToday.invalidate();
      utils.songs.getHistory.invalidate();
      toast.success("Musica do dia publicada!");
    },
    onError: () => toast.error("Erro ao publicar musica"),
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    searchSpotify.mutate({ q: query.trim() });
  };

  const handlePublish = (track: SpotifyTrack) => {
    publishSong.mutate({
      spotifyId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      image: track.image,
      spotifyUrl: track.spotifyUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: mc.color }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 text-center">
        <Crown className="w-16 h-16 mx-auto mb-4" style={{ color: mc.color, opacity: 0.5 }} />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>Apenas administradores podem acessar esta pagina.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="transition-all hover:scale-105" style={{ borderColor: mc.color, color: mc.color }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-20">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 0 20px ${mc.glow}` }}>
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Painel Admin</h1>
          <p style={{ color: "var(--text-muted)" }}>Busque e publique a Musica do Dia</p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-8" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: `1px solid color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex gap-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome da musica ou artista..."
              className="flex-1 bg-white/5 h-12 rounded-xl text-white placeholder:text-white/30 focus:ring-1 focus:outline-none transition-colors"
              style={{ borderColor: `color-mix(in srgb, ${mc.color} 25%, rgba(255,255,255,0.1))` }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}
              className="h-12 px-6 rounded-xl text-black font-bold hover:opacity-90 transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 4px 20px ${mc.glow}` }}
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Buscar</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4" style={{ color: mc.color }}>Resultados</h2>
          {results.map((track) => (
            <div key={track.id} className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:translate-x-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px)",
                border: `1px solid rgba(255,255,255,0.1)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, ${mc.color} 50%, transparent)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px rgba(0,0,0,0.25)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `rgba(255,255,255,0.1)`;
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--bg-mid)" }}>
                {track.image ? (
                  <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">♪</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{track.title}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{track.artist} &bull; {track.album}</div>
              </div>
              <Button onClick={() => handlePublish(track)} disabled={publishSong.isPending}
                className="w-11 h-11 rounded-full p-0 transition-all hover:scale-110 hover:rotate-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 4px 15px ${mc.glow}` }}
              >
                {publishSong.isPending ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Plus className="w-5 h-5 text-black" />}
              </Button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && query && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3" style={{ opacity: 0.5 }}>😕</div>
          <p style={{ color: "var(--text-muted)" }}>Nenhuma musica encontrada</p>
        </div>
      )}

      {!query && !searching && (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          <p style={{ color: "var(--text-muted)" }}>Digite o nome de uma musica ou artista para buscar no Spotify</p>
        </div>
      )}
    </div>
  );
}
