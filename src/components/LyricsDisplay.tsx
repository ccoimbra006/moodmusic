import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface LyricsDisplayProps {
  title: string;
  artist: string;
  moodColor?: string;
}

export default function LyricsDisplay({ title, artist, moodColor = "#00d4ff" }: LyricsDisplayProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = trpc.lyrics.get.useQuery(
    { title, artist },
    { enabled: open }
  );

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: moodColor }} />
          <span className="text-sm font-semibold">Letra da Musica</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {isLoading && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>A carregar letra...</span>
            </div>
          )}

          {!isLoading && data?.lyrics && (
            <pre className="text-sm whitespace-pre-wrap leading-relaxed py-2" style={{
              color: "var(--text-secondary)",
              fontFamily: "inherit",
              maxHeight: "400px",
              overflowY: "auto",
            }}>
              {data.lyrics}
            </pre>
          )}

          {!isLoading && !data?.lyrics && (
            <div className="py-4 text-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Letra nao disponivel para esta musica.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
