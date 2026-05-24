import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { FileText, ChevronDown, ChevronUp, Loader2, Music } from "lucide-react";

interface LyricsDisplayProps {
  title: string;
  artist: string;
  moodColor?: string;
}

export default function LyricsDisplay({ title, artist, moodColor = "#00d4ff" }: LyricsDisplayProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = trpc.lyrics.get.useQuery(
    { title, artist },
    { enabled: open, retry: 1, staleTime: 1000 * 60 * 10 }
  );

  const hasLyrics = !!data?.lyrics && data.lyrics.length > 10;

  return (
    <div className="rounded-2xl overflow-hidden transition-colors" style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: moodColor }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Letra da Musica</span>
        </div>
        <div className="flex items-center gap-2">
          {hasLyrics && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${moodColor}15`, color: moodColor }}>
              disponivel
            </span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {isLoading && (
            <div className="flex items-center gap-2 py-6">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: moodColor }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>A procurar letra...</span>
            </div>
          )}

          {!isLoading && hasLyrics && (
            <div className="py-2">
              <pre className="text-sm whitespace-pre-wrap leading-[1.8]" style={{
                color: "var(--text-secondary)",
                fontFamily: "inherit",
                maxHeight: "450px",
                overflowY: "auto",
                paddingRight: "8px",
              }}>
                {data!.lyrics}
              </pre>
              <p className="text-[10px] mt-3 text-right" style={{ color: "var(--text-muted)" }}>
                Fonte: lyrics.ovh
              </p>
            </div>
          )}

          {!isLoading && !hasLyrics && (
            <div className="py-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Letra nao disponivel para esta musica.
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                Tente mais tarde ou procure no Google.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
