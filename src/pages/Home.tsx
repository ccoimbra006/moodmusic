import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentMood } from "@/hooks/useMood";
import { getMoodColors, setGlobalMood, ALL_MOODS } from "@/lib/moods";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FollowButton } from "@/components/FollowButton";
import ShareCard from "@/components/ShareCard";
import MoodPoll from "@/components/MoodPoll";
import { Loader2 } from "lucide-react";
import {
  Heart,
  ThumbsDown,
  Star,
  Share2,
  ExternalLink,
  Play,
  MessageCircle,
  Send,
  Music,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Disc3,
  MessageSquareText,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentMood = useCurrentMood();
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [albumTilt, setAlbumTilt] = useState({ x: 0, y: 0 });
  const albumRef = useRef<HTMLDivElement>(null);
  const [likeAnim, setLikeAnim] = useState(false);
  const utils = trpc.useUtils();

  const { data: todaySong } = trpc.songs.getToday.useQuery();
  const { data: history } = trpc.songs.getHistory.useQuery();
  const hasSongId = Boolean(todaySong?.id);
  const { data: likeCount } = trpc.likes.getBySong.useQuery(
    { songId: todaySong?.id ?? 0 }, { enabled: hasSongId }
  );
  const { data: myLike } = trpc.likes.getMyLike.useQuery(
    { songId: todaySong?.id ?? 0 }, { enabled: hasSongId && isAuthenticated }
  );
  const { data: isFavorited } = trpc.favorites.getBySong.useQuery(
    { songId: todaySong?.id ?? 0 }, { enabled: hasSongId && isAuthenticated }
  );
  const { data: commentsData } = trpc.comments.getBySong.useQuery(
    { songId: todaySong?.id ?? 0 }, { enabled: hasSongId }
  );
  // Mood do utilizador (para quando seleciona manualmente)
  trpc.moods.getCurrent.useQuery(
    { songId: todaySong?.id ?? 0 }, { enabled: hasSongId && isAuthenticated }
  );

  const toggleLike = trpc.likes.toggle.useMutation({
    onSuccess: () => {
      utils.likes.getBySong.invalidate({ songId: todaySong?.id ?? 0 });
      utils.likes.getMyLike.invalidate({ songId: todaySong?.id ?? 0 });
      if (todaySong?.id) utils.history.getMyStats.invalidate();
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 300);
    },
  });
  const toggleFavorite = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      utils.favorites.getBySong.invalidate({ songId: todaySong?.id ?? 0 });
      if (todaySong?.id) utils.history.getMyStats.invalidate();
    },
  });
  const setMood = trpc.moods.set.useMutation({
    onSuccess: () => {
      utils.moods.getCurrent.invalidate({ songId: todaySong?.id ?? 0 });
      utils.moods.getMyStats.invalidate();
    },
  });
  // Optimistic update: show comment instantly without waiting for server
  const postComment = trpc.comments.create.useMutation({
    onMutate: async (newComment) => {
      await utils.comments.getBySong.cancel({ songId: newComment.songId });
      const prevData = utils.comments.getBySong.getData({ songId: newComment.songId });
      const optimisticComment = {
        id: Date.now(), // temporary id
        text: newComment.text,
        createdAt: new Date(),
        userId: user?.id ?? 0,
        userName: user?.name ?? "Tu",
        userAvatar: user?.avatar ?? null,
        replies: [] as { id: number; text: string; createdAt: Date; userId: number; userName: string | null }[],
      };
      utils.comments.getBySong.setData(
        { songId: newComment.songId },
        { comments: [...(prevData?.comments ?? []), optimisticComment] }
      );
      setCommentText("");
      return { prevData };
    },
    onError: (_err, newComment, ctx) => {
      if (ctx?.prevData) {
        utils.comments.getBySong.setData({ songId: newComment.songId }, ctx.prevData);
      }
      toast.error("Erro ao publicar comentario");
    },
    onSettled: (_data, _err, vars) => {
      utils.comments.getBySong.invalidate({ songId: vars.songId });
    },
  });

  const postReply = trpc.comments.reply.useMutation({
    onMutate: async (newReply) => {
      await utils.comments.getBySong.cancel({ songId: todaySong?.id ?? 0 });
      const prevData = utils.comments.getBySong.getData({ songId: todaySong?.id ?? 0 });
      const optimisticReply = {
        id: Date.now(),
        text: newReply.text,
        createdAt: new Date(),
        userId: user?.id ?? 0,
        userName: user?.name ?? "Tu",
      };
      const updatedComments = prevData?.comments.map((c: { id: number; text: string; createdAt: Date | string; userId: number; userName: string | null; userAvatar: string | null; replies?: { id: number; text: string; createdAt: Date | string; userId: number; userName: string | null }[] }) => {
        if (c.id === newReply.commentId) {
          return { ...c, replies: [...(c.replies ?? []), optimisticReply] };
        }
        return c;
      }) ?? [];
      utils.comments.getBySong.setData(
        { songId: todaySong?.id ?? 0 },
        { comments: updatedComments }
      );
      setReplyText("");
      setActiveReplyId(null);
      return { prevData };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevData) {
        utils.comments.getBySong.setData({ songId: todaySong?.id ?? 0 }, ctx.prevData);
      }
      toast.error("Erro ao publicar resposta");
    },
    onSettled: () => {
      if (todaySong?.id) utils.comments.getBySong.invalidate({ songId: todaySong.id });
    },
  });
  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => { utils.comments.getBySong.invalidate({ songId: todaySong?.id ?? 0 }); },
  });
  const recordActivity = trpc.history.record.useMutation();
  const selectMood = trpc.moods.set.useMutation();

  // Reset states AND invalidate cache when song changes
  useEffect(() => {
    if (todaySong?.id) {
      setCommentText("");
      setReplyText("");
      setActiveReplyId(null);
      setExpandedReplies(new Set());
      setLikeAnim(false);
      // Force refetch so old song's likes/favorites/comments don't persist
      utils.likes.getBySong.invalidate({ songId: todaySong.id });
      utils.likes.getMyLike.invalidate({ songId: todaySong.id });
      utils.favorites.getBySong.invalidate({ songId: todaySong.id });
      utils.comments.getBySong.invalidate({ songId: todaySong.id });
      utils.moods.getCurrent.invalidate({ songId: todaySong.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySong?.id]);

  // Sync detected mood to global state ONLY when a song with mood is published
  useEffect(() => {
    if (todaySong?.detectedMood) {
      setGlobalMood(todaySong.detectedMood);
    } else {
      // Reset to neutral when no song has a mood
      localStorage.removeItem("moodtrack_current_mood");
    }
  }, [todaySong?.detectedMood]);

  useEffect(() => {
    if (todaySong?.id && isAuthenticated) {
      recordActivity.mutate({ action: "listen", songId: todaySong.id });
      // Also record the song's mood for "Most Listened" stats
      if (todaySong.detectedMood) {
        selectMood.mutate({ songId: todaySong.id, mood: todaySong.detectedMood });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySong?.id]);

  // Theme: ONLY use song's detectedMood. No mood = neutral black.
  // Ignore myMood (user selection) when there's no song published.
  const hasSongMood = Boolean(todaySong?.id && todaySong?.detectedMood);
  const tc = hasSongMood
    ? getMoodColors(todaySong!.detectedMood!)
    : { color: "#888", color2: "#555", glow: "rgba(80,80,80,0.3)" };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!albumRef.current) return;
    const rect = albumRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (window.innerWidth / 2);
    const dy = (e.clientY - cy) / (window.innerHeight / 2);
    setAlbumTilt({ x: dx * 12, y: -dy * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => { setAlbumTilt({ x: 0, y: 0 }); }, []);

  const handleSetMood = (moodKey: string) => {
    setGlobalMood(moodKey);
    if (todaySong?.id && isAuthenticated) setMood.mutate({ songId: todaySong.id, mood: moodKey });
  };

  const handleToggleLike = () => {
    if (!isAuthenticated) { toast.error("Faca login para curtir"); navigate("/login"); return; }
    if (!todaySong?.id) return;
    toggleLike.mutate({ songId: todaySong.id, type: "like" });
  };
  const handleToggleDislike = () => {
    if (!isAuthenticated) { toast.error("Faca login para avaliar"); navigate("/login"); return; }
    if (!todaySong?.id) return;
    toggleLike.mutate({ songId: todaySong.id, type: "dislike" });
  };
  const handleToggleFavorite = () => {
    if (!isAuthenticated) { toast.error("Faca login para favoritar"); navigate("/login"); return; }
    if (!todaySong?.id) return;
    toggleFavorite.mutate({ songId: todaySong.id });
    toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos!");
  };
  const handleShare = async () => {
    if (!todaySong) return;
    const text = `🎵 ${todaySong.title} — ${todaySong.artist} #MoodTrack`;
    const url = todaySong.spotifyUrl ?? window.location.href;
    if (navigator.share) await navigator.share({ title: "MoodTrack", text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); toast.success("Link copiado!"); }
    if (todaySong.id && isAuthenticated) recordActivity.mutate({ action: "share", songId: todaySong.id });
  };
  const handlePostComment = () => {
    if (!isAuthenticated) { toast.error("Faca login para comentar"); navigate("/login"); return; }
    if (!commentText.trim() || !todaySong?.id) return;
    postComment.mutate({ songId: todaySong.id, text: commentText.trim() });
  };
  const handlePostReply = (commentId: number) => {
    if (!replyText.trim() || !todaySong?.id) return;
    postReply.mutate({ commentId, text: replyText.trim() });
  };
  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const currentMoodData = ALL_MOODS.find((m) => m.key === currentMood) ?? ALL_MOODS[0];
  const commentCount = commentsData?.comments?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* ===== HERO ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-100px)] py-8">
        {/* Album Art */}
        <div className="flex justify-center perspective-[1200px]">
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px]">
            <div className="absolute inset-[-30px] rounded-[40px] z-[-2] animate-bg-breathe"
              style={{ background: `radial-gradient(circle, ${tc.glow}, transparent 70%)`, filter: "blur(40px)" }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] rounded-[32px] z-[-1] animate-[glowSpin_6s_linear_infinite]"
              style={{ background: `conic-gradient(from 0deg, ${tc.color}, ${tc.color2}, ${tc.color})`, filter: "blur(50px)", opacity: 0.35 }}
            />
            <div className="absolute top-1/2 -right-[70px] w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[360px] lg:h-[360px] rounded-full z-[-2] opacity-55 hidden lg:block"
              style={{ background: "repeating-radial-gradient(#1a1a1a 0px,#1a1a1a 2px,#252525 3px,#252525 4px)", transform: "translateY(-50%)", boxShadow: "0 15px 50px rgba(0,0,0,0.6)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})` }}
              >
                <div className="w-4 h-4 bg-[var(--bg-deep)] rounded-full" />
              </div>
            </div>
            <div ref={albumRef}
              className="relative w-full h-full rounded-3xl overflow-hidden group cursor-pointer"
              style={{
                transform: `rotateY(${albumTilt.x}deg) rotateX(${albumTilt.y}deg) scale(1.03)`,
                transition: "transform 0.3s ease-out",
                boxShadow: `0 30px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px -20px ${tc.glow}`,
              }}
              onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
            >
              {todaySong?.image ? (
                <img src={todaySong.image} alt={todaySong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--bg-mid)] flex items-center justify-center text-6xl">♪</div>
              )}
              {todaySong && (
                <div className="absolute top-3 right-3 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg" style={{ background: tc.color }}>
                  <Music className="w-3.5 h-3.5" /> Spotify
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest w-fit">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tc.color }} />
            Musica do Dia
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-[-1px] text-gradient">
            {todaySong?.title ?? "Nenhuma musica hoje"}
          </h1>
          <p className="text-lg sm:text-xl font-medium" style={{ color: "var(--text-secondary)" }}>
            {todaySong?.artist ?? "Aguarde o admin publicar uma musica"}
          </p>
          <p className="text-sm sm:text-base leading-relaxed max-w-md" style={{ color: "var(--text-muted)" }}>
            {todaySong?.description ?? `${todaySong?.title ?? "MoodTrack"} por ${todaySong?.artist ?? "MoodTrack"} — a musica que define o dia.`}
          </p>

          {todaySong?.detectedMood && (
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5" style={{ color: tc.color }} />
              <span style={{ color: tc.color }}>Mood detectado: {currentMoodData.emoji} {currentMoodData.label}</span>
            </div>
          )}

          {todaySong?.id && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-[2px] uppercase font-mono" style={{ color: "var(--text-muted)" }}>Escolher mood</span>
            <div className="flex flex-wrap gap-2">
              {ALL_MOODS.map((m) => {
                const mcol = getMoodColors(m.key);
                const isActive = currentMood === m.key;
                return (
                  <button key={m.key} onClick={() => handleSetMood(m.key)}
                    className="px-4 py-2 rounded-full text-sm transition-all duration-300 border backdrop-blur-sm"
                    style={{
                      borderColor: isActive ? mcol.color : "rgba(255,255,255,0.08)",
                      color: isActive ? mcol.color : "rgba(240,240,240,0.55)",
                      background: isActive ? `color-mix(in srgb, ${mcol.color} 12%, transparent)` : "rgba(255,255,255,0.04)",
                      boxShadow: isActive ? `0 4px 20px ${mcol.glow}` : "none",
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Mood Poll */}
          <MoodPoll />

          {todaySong?.spotifyId && (
            <div className="rounded-2xl overflow-hidden transition-shadow duration-500"
              style={{ background: "#000", border: `1px solid color-mix(in srgb, ${tc.color} 20%, rgba(255,255,255,0.1))`, boxShadow: `0 0 40px -10px ${tc.glow}` }}
            >
              <iframe src={`https://open.spotify.com/embed/track/${todaySong.spotifyId}?utm_source=generator&theme=0`}
                width="100%" height="152" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" className="block"
              />
            </div>
          )}

          {todaySong && (
            <div className="flex flex-wrap gap-3">
              <a href={todaySong.spotifyUrl ?? `https://open.spotify.com/track/${todaySong.spotifyId}`} target="_blank" rel="noopener noreferrer"
                className="btn-lift inline-flex items-center gap-2.5 text-white px-6 py-3.5 rounded-full text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})`, boxShadow: `0 4px 20px ${tc.glow}` }}
              >
                <ExternalLink className="w-5 h-5" /> Abrir no Spotify
              </a>
              <ShareCard
                title={todaySong.title}
                artist={todaySong.artist}
                image={todaySong.image ?? undefined}
                mood={todaySong.detectedMood ?? undefined}
              />
            </div>
          )}

          {todaySong && (
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={handleToggleLike}
                className="btn-lift inline-flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-bold transition-all duration-300 border backdrop-blur-sm"
                style={{
                  borderColor: myLike?.type === "like" ? tc.color : "rgba(255,255,255,0.1)",
                  color: myLike?.type === "like" ? tc.color : "rgba(240,240,240,0.6)",
                  background: myLike?.type === "like" ? `color-mix(in srgb, ${tc.color} 15%, transparent)` : "rgba(255,255,255,0.04)",
                  boxShadow: myLike?.type === "like" ? `0 4px 20px ${tc.glow}` : "none",
                }}
              >
                <Heart className={`w-5 h-5 transition-all ${myLike?.type === "like" ? "fill-current" : ""} ${likeAnim ? "animate-[heartBoom_0.3s_ease]" : ""}`} />
                <span className={`font-mono text-base ${likeAnim ? "animate-counter" : ""}`}>{likeCount?.count ?? 0}</span>
              </button>
              <button onClick={handleToggleDislike}
                className="btn-lift inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-300 border backdrop-blur-sm"
                style={{
                  borderColor: myLike?.type === "dislike" ? tc.color2 : "rgba(255,255,255,0.1)",
                  color: myLike?.type === "dislike" ? tc.color2 : "rgba(240,240,240,0.6)",
                  background: myLike?.type === "dislike" ? `color-mix(in srgb, ${tc.color2} 12%, transparent)` : "rgba(255,255,255,0.04)",
                }}
              >
                <ThumbsDown className={`w-5 h-5 ${myLike?.type === "dislike" ? "fill-current" : ""}`} />
              </button>
              <button onClick={handleToggleFavorite}
                className="btn-lift inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-300 border backdrop-blur-sm"
                style={{
                  borderColor: isFavorited ? tc.color : "rgba(255,255,255,0.1)",
                  color: isFavorited ? tc.color : "rgba(240,240,240,0.6)",
                  background: isFavorited ? `color-mix(in srgb, ${tc.color} 12%, transparent)` : "rgba(255,255,255,0.04)",
                  boxShadow: isFavorited ? `0 4px 20px ${tc.glow}` : "none",
                }}
              >
                <Star className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} /> Favoritar
              </button>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full glass" style={{ color: tc.color2 }}>
                <Sparkles className="w-3 h-3 inline mr-1" />{currentMoodData.emoji} {currentMoodData.label}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ===== COMMENTS SECTION — WITH IDENTITY ===== */}
      {todaySong && (
        <section className="mt-10 animate-fade-in-up">
          <div className="w-full max-w-[680px] mx-auto rounded-[20px] p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid color-mix(in srgb, ${tc.color} 15%, rgba(255,255,255,0.08))`,
              boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.05), 0 0 60px -20px ${tc.glow}`,
            }}
          >
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})`, boxShadow: `0 4px 15px ${tc.glow}` }}
              >
                <MessageSquareText className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Comentarios</h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${tc.color} 12%, transparent)`, color: tc.color, border: `1px solid color-mix(in srgb, ${tc.color} 25%, transparent)` }}
              >{commentCount}</span>
            </div>

            {/* Comment Input */}
            <div className="flex gap-3 mb-6">
              <div className="shrink-0 pt-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})`, boxShadow: `0 2px 10px ${tc.glow}` }}
                >
                  {(user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl p-4 transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${commentText.length > 0 ? `color-mix(in srgb, ${tc.color} 25%, rgba(255,255,255,0.12))` : "rgba(255,255,255,0.08)"}`,
                    boxShadow: commentText.length > 0 ? `0 0 20px ${tc.glow}` : "none",
                  }}
                >
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isAuthenticated ? "O que achaste desta musica? 🎧" : "Faca login para comentar"}
                    disabled={!isAuthenticated}
                    maxLength={200}
                    className="w-full bg-transparent text-white placeholder:text-white/20 resize-none text-sm leading-relaxed outline-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(commentText.length / 200) * 100}%`,
                          background: commentText.length >= 180 ? "#ef4444" : `linear-gradient(90deg, ${tc.color}, ${tc.color2})`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums"
                      style={{ color: commentText.length >= 180 ? "#ef4444" : "var(--text-muted)" }}
                    >{commentText.length}/200</span>
                  </div>
                </div>
                <div className="flex justify-end mt-2.5">
                  <button onClick={handlePostComment}
                    disabled={!commentText.trim() || !isAuthenticated || postComment.isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    style={{
                      background: commentText.trim() && isAuthenticated ? `linear-gradient(135deg, ${tc.color}, ${tc.color2})` : "rgba(255,255,255,0.06)",
                      color: commentText.trim() && isAuthenticated ? "white" : "rgba(255,255,255,0.3)",
                      boxShadow: commentText.trim() && isAuthenticated ? `0 4px 15px ${tc.glow}` : "none",
                    }}
                  >
                    {postComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Comentar</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            {commentCount > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: `color-mix(in srgb, ${tc.color} 15%, rgba(255,255,255,0.06))` }} />
                <span className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: "var(--text-muted)" }}>Comentarios anteriores</span>
                <div className="flex-1 h-px" style={{ background: `color-mix(in srgb, ${tc.color} 15%, rgba(255,255,255,0.06))` }} />
              </div>
            )}

            {/* Empty State */}
            {commentCount === 0 && (
              <div className="text-center py-10 opacity-60">
                <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Nenhum comentario ainda</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Seja o primeiro a partilhar a sua opiniao!</p>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-3">
              {commentsData?.comments?.map((comment: { id: number; text: string; createdAt: Date | string; userId: number; userName: string | null; userAvatar: string | null; replies?: { id: number; text: string; createdAt: Date | string; userId: number; userName: string | null; }[] }, idx: number) => {
                const replyCount = comment.replies?.length ?? 0;
                const isExpanded = expandedReplies.has(comment.id);
                const isReplying = activeReplyId === comment.id;

                return (
                  <div key={comment.id} className="rounded-xl p-4 animate-slide-in transition-all hover:bg-white/[0.03]"
                    style={{
                      animationDelay: `${idx * 0.05}s`,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})` }}
                      >
                        {(comment.userName ?? "A").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            to={`/profile/${comment.userId}`}
                            className="text-sm font-bold hover:underline transition-all"
                            style={{ color: tc.color }}
                          >
                            {comment.userName ?? "Anonimo"}
                          </Link>
                          <FollowButton userId={comment.userId} compact />
                          {comment.userId === todaySong.addedBy && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              style={{ background: `color-mix(in srgb, ${tc.color} 10%, transparent)`, color: tc.color, border: `1px solid color-mix(in srgb, ${tc.color} 20%, transparent)` }}
                            >Autor</span>
                          )}
                          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <Clock className="w-3 h-3" />{timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed break-words" style={{ color: "var(--text-primary)" }}>{comment.text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
                            className="text-xs font-semibold transition-colors hover:text-white" style={{ color: isReplying ? tc.color2 : "var(--text-muted)" }}
                          >Responder</button>
                          {replyCount > 0 && (
                            <button onClick={() => toggleReplies(comment.id)}
                              className="text-xs font-semibold transition-colors hover:text-white flex items-center gap-1" style={{ color: tc.color }}
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {replyCount} {replyCount === 1 ? "resposta" : "respostas"}
                            </button>
                          )}
                          {(user?.id === comment.userId || user?.role === "admin") && (
                            <button onClick={() => deleteComment.mutate({ id: comment.id })}
                              className="text-xs font-semibold transition-colors hover:text-red-400" style={{ color: "var(--text-muted)" }}
                            >Excluir</button>
                          )}
                        </div>

                        {isReplying && (
                          <div className="flex gap-2 mt-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: `linear-gradient(135deg, ${tc.color2}, ${tc.color})` }}
                            >
                              {(user?.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-2">
                                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva uma resposta..."
                                  className="flex-1 bg-white/[0.03] rounded-lg text-white placeholder:text-white/20 resize-none text-sm py-1.5 px-2 outline-none transition-all"
                                  style={{ border: `1px solid color-mix(in srgb, ${tc.color2} 20%, rgba(255,255,255,0.06))` }}
                                  rows={1}
                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostReply(comment.id); } }}
                                />
                                <Button onClick={() => handlePostReply(comment.id)} disabled={!replyText.trim() || postReply.isPending}
                                  className="rounded-lg px-3 h-8 text-xs font-bold text-white hover:opacity-90 shrink-0 self-start"
                                  style={{ background: tc.color2, boxShadow: `0 2px 8px ${tc.glow}` }}
                                >
                                  {postReply.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {replyCount > 0 && isExpanded && (
                          <div className="mt-3 pl-3" style={{ borderLeft: `2px solid color-mix(in srgb, ${tc.color2} 20%, transparent)` }}>
                            <div className="flex flex-col gap-3">
                              {comment.replies?.map((reply: { id: number; text: string; createdAt: Date | string; userId: number; userName: string | null }) => (
                                <div key={reply.id} className="flex gap-2.5 animate-slide-in">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${tc.color2}, ${tc.color})` }}
                                  >
                                    {(reply.userName ?? "A").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <Link
                                        to={`/profile/${reply.userId}`}
                                        className="text-sm font-bold hover:underline transition-all"
                                        style={{ color: tc.color2 }}
                                      >
                                        {reply.userName ?? "Anonimo"}
                                      </Link>
                                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{timeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed break-words" style={{ color: "var(--text-primary)" }}>{reply.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== HISTORY SECTION — WITH IDENTITY ===== */}
      <section className="mt-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="w-full max-w-[680px] mx-auto rounded-[20px] p-6 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid color-mix(in srgb, ${tc.color} 15%, rgba(255,255,255,0.08))`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.05), 0 0 60px -20px ${tc.glow}`,
          }}
        >
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${tc.color2}, ${tc.color})`, boxShadow: `0 4px 15px ${tc.glow}` }}
            >
              <Disc3 className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Musicas Anteriores</h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `color-mix(in srgb, ${tc.color2} 12%, transparent)`, color: tc.color2, border: `1px solid color-mix(in srgb, ${tc.color2} 25%, transparent)` }}
            >{history?.length ?? 0}</span>
          </div>

          {/* Empty State */}
          {(!history || history.length === 0) && (
            <div className="text-center py-10 opacity-60">
              <Disc3 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Nenhuma musica anterior</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>As musicas do dia vao aparecer aqui</p>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {history?.map((song: { id: number; title: string; artist: string; image: string | null; detectedMood: string | null; date: Date | string; likesCount: number | null; spotifyId: string | null }) => {
              const hmc = getMoodColors(song.detectedMood ?? "chill");
              return (
                <div key={song.id}
                  onClick={() => {
                    if (song.spotifyId) {
                      window.open(`https://open.spotify.com/embed/track/${song.spotifyId}`, "_blank");
                    }
                  }}
                  className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = `color-mix(in srgb, ${hmc.color} 40%, transparent)`;
                    el.style.transform = "translateY(-4px) scale(1.02)";
                    el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px -10px ${hmc.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.transform = "translateY(0) scale(1)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div className="relative aspect-square overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                    {song.image ? (
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">♪</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ background: `color-mix(in srgb, ${hmc.color} 20%, rgba(0,0,0,0.5))` }}
                    >
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110">
                        <Play className="w-5 h-5 ml-0.5" style={{ color: hmc.color }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: hmc.color, opacity: 0.8 }}>
                      {timeAgo(song.date)}
                    </div>
                    <h3 className="text-sm font-semibold truncate leading-snug">{song.title}</h3>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{song.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Admin FAB */}
      {user?.role === "admin" && (
        <button onClick={() => navigate("/admin")}
          className="btn-lift fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50"
          style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color2})`, boxShadow: `0 6px 25px ${tc.glow}`, animation: "fabPulse 3s ease-in-out infinite" }}
          title="Publicar Musica do Dia"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}
    </div>
  );
}