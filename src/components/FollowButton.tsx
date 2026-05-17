import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  userId: number;
  compact?: boolean;
}

export function FollowButton({ userId, compact = false }: FollowButtonProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [localState, setLocalState] = useState<"idle" | "following">("idle");

  const { data: isFollowing } = trpc.follows.isFollowing.useQuery(
    { userId },
    { enabled: !!user && user.id !== userId }
  );

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate({ userId });
      utils.follows.getFollowCounts.invalidate({ userId });
      toast.success("A seguir!");
      setLocalState("following");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao seguir");
    },
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate({ userId });
      utils.follows.getFollowCounts.invalidate({ userId });
      toast.success("Deixaste de seguir");
      setLocalState("idle");
    },
  });

  if (!user || user.id === userId) return null;

  const following = isFollowing || localState === "following";

  const handleClick = () => {
    if (following) {
      unfollowMutation.mutate({ userId });
    } else {
      followMutation.mutate({ userId });
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={followMutation.isPending || unfollowMutation.isPending}
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all border"
        style={{
          borderColor: following ? "rgba(255,255,255,0.1)" : "rgba(29,185,84,0.4)",
          color: following ? "var(--text-muted)" : "#1DB954",
          background: following ? "rgba(255,255,255,0.03)" : "rgba(29,185,84,0.08)",
        }}
      >
        {following ? "Seguindo" : "Seguir"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      className="btn-lift inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border"
      style={{
        borderColor: following ? "rgba(255,255,255,0.1)" : "rgba(29,185,84,0.4)",
        color: following ? "var(--text-muted)" : "#1DB954",
        background: following ? "rgba(255,255,255,0.03)" : "rgba(29,185,84,0.08)",
      }}
    >
      {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? "Seguindo" : "Seguir"}
    </button>
  );
}
