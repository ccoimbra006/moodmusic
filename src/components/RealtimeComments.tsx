import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMoodColors } from "@/lib/moods";
import { timeAgo } from "@/lib/utils";
import { Send, MessageCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface RealtimeCommentsProps {
  songId: number;
  moodColor?: string;
}

export default function RealtimeComments({ songId, moodColor = "#00d4ff" }: RealtimeCommentsProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [justAdded, setJustAdded] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Polling every 5 seconds for "realtime" feel
  const { data: comments, isLoading } = trpc.comments.getBySong.useQuery(
    { songId },
    { refetchInterval: 5000 }
  );

  const addComment = trpc.comments.create.useMutation({
    onSuccess: (data) => {
      setText("");
      if (data.id) {
        setJustAdded((prev) => [...prev, data.id]);
        setTimeout(() => setJustAdded((prev) => prev.filter((id) => id !== data.id)), 3000);
      }
      utils.comments.getBySong.invalidate({ songId });
      toast.success("Comentario adicionado!");
    },
    onError: () => toast.error("Erro ao comentar"),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments?.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addComment.mutate({ songId, text: text.trim() });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: moodColor }} />
          <span className="text-sm font-semibold">Comentarios</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: "rgba(0,255,157,0.1)", color: "#00ff9d" }}
          >
            <Zap className="w-3 h-3" />
            tempo real
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {comments?.length ?? 0}
        </span>
      </div>

      {/* Comments list */}
      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        {!isLoading && (!comments || comments.length === 0) && (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Seja o primeiro a comentar!
            </p>
          </div>
        )}

        {comments?.map((c) => {
          const isNew = justAdded.includes(c.id);
          return (
            <div
              key={c.id}
              className="transition-all duration-500"
              style={{
                background: isNew ? "rgba(0,255,157,0.05)" : "transparent",
                borderRadius: "12px",
                padding: isNew ? "8px" : "0",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${moodColor}20`, color: moodColor }}
                >
                  {(c.userName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{c.userName || "Usuario"}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(c.createdAt)}
                    </span>
                    {isNew && (
                      <span className="text-[10px] px-1.5 rounded-full" style={{ background: "rgba(0,255,157,0.15)", color: "#00ff9d" }}>
                        novo
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 break-words" style={{ color: "var(--text-secondary)" }}>
                    {c.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 flex gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreve um comentario..."
            className="flex-1 bg-white/5 rounded-xl text-sm h-10"
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || addComment.isPending}
            className="h-10 w-10 p-0 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${moodColor}, ${moodColor})`, opacity: text.trim() ? 1 : 0.5 }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      {!user && (
        <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          Faca login para comentar
        </div>
      )}
    </div>
  );
}
