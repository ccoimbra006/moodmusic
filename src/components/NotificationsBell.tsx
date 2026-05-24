import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";

export default function NotificationsBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: unread } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full transition-all hover:bg-white/10"
      >
        <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        {(unread?.count ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "#ff4fd8", color: "#fff" }}
          >
            {unread!.count > 9 ? "9+" : unread!.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(20,20,20,0.95)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-sm font-semibold">Notificações</span>
            {(unread?.count ?? 0) > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs hover:underline" style={{ color: "#00d4ff" }}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead.mutate({ id: n.id })}
                  className="p-3 cursor-pointer transition-colors hover:bg-white/5"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: n.read ? "transparent" : "rgba(0,212,255,0.05)",
                  }}
                >
                  <div className="text-xs font-semibold">{n.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.message}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Sem notificacoes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
