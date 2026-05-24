import { useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "./useAuth";

export function useStreak() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: streak } = trpc.streaks.get.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: isAuthenticated && !!user?.id }
  );

  const trackVisit = trpc.streaks.trackVisit.useMutation({
    onSuccess: () => {
      utils.streaks.get.invalidate();
      utils.streaks.leaderboard.invalidate();
    },
  });

  // Track visit on mount when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      trackVisit.mutate();
    }
  }, [isAuthenticated, user?.id]);

  return {
    streak,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
  };
}
