import { useCallback, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import type { AuthUser } from "@/types/auth";

export { type AuthUser } from "@/types/auth";

export function useAuth(options?: { redirectOnUnauthenticated?: boolean }) {
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  // Try auth (any provider)
  const { data: authUser, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fallback to local auth
  const { data: localUser, isLoading: localLoading } = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !authUser && !!localStorage.getItem("moodtrack_token"),
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const user = useMemo((): AuthUser | undefined => {
    if (authUser) return authUser as AuthUser;
    if (localUser) return localUser as AuthUser;
    return undefined;
  }, [authUser, localUser]);

  const isLoading = authLoading && (localStorage.getItem("moodtrack_token") ? localLoading : true);

  if (options?.redirectOnUnauthenticated && !isLoading && !user) {
    navigate("/login");
  }

  const logout = useCallback(async () => {
    // Call server logout to clear HttpOnly cookies
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore errors
    }
    // Also clear local auth token
    localStorage.removeItem("moodtrack_token");
    // Reset all queries and reload
    utils.invalidate();
    window.location.href = "/login";
  }, [logoutMutation, utils]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
