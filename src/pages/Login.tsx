import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Music,
  ArrowLeft,
  Shield,
  Sparkles,
  Mail,
  Lock,
  User,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  // Login is always neutral black — no mood colors
  const mc = { color: "#888", color2: "#555", glow: "rgba(80,80,80,0.3)" };
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { data: googleUrl } = trpc.googleAuth.getUrl.useQuery(undefined, {
    enabled: !isAuthenticated,
  });

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("moodtrack_token", data.token);
      toast.success("Login efetuado com sucesso!");
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao entrar");
    },
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("moodtrack_token", data.token);
      toast.success("Conta criada com sucesso!");
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta");
    },
  });

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ name, email, password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-6 left-4 transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
              boxShadow: `0 0 40px ${mc.glow}`,
            }}
          >
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">
            {mode === "login" ? "Entrar" : "Criar Conta"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {mode === "login"
              ? "Entra na tua conta para continuar"
              : "Cria uma conta gratuita"}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={() => {
            if (googleUrl?.url) {
              window.location.href = googleUrl.url;
            } else {
              toast.error("Google login nao configurado");
            }
          }}
          className="btn-lift w-full flex items-center justify-center gap-3 h-12 rounded-xl text-sm font-bold transition-all bg-white text-gray-800 hover:bg-gray-100"
          style={{
            boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
          }}
        >
          <GoogleIcon className="w-5 h-5" /> Entrar com Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            ou com email
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Email Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[20px] p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: `1px solid color-mix(in srgb, ${mc.color} 15%, rgba(255,255,255,0.08))`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.05)`,
          }}
        >
          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  required
                  className="pl-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20 focus:border-[var(--mood-color)]"
                  style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teu@email.com"
                required
                className="pl-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20"
                style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimo 6 caracteres" : "A tua senha"}
                required
                minLength={mode === "register" ? 6 : undefined}
                className="pl-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20"
                style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-lift w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
              boxShadow: `0 4px 20px ${mc.glow}`,
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" /> Entrar
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Criar Conta
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-sm font-semibold transition-colors hover:text-white"
            style={{ color: mc.color }}
          >
            {mode === "login"
              ? "Nao tens conta? Cria uma gratuita"
              : "Ja tens conta? Entra aqui"}
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Sparkles className="w-4 h-4" style={{ color: mc.color }} />
            <span className="text-[10px] font-semibold text-center" style={{ color: "var(--text-muted)" }}>Moods</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Music className="w-4 h-4" style={{ color: mc.color }} />
            <span className="text-[10px] font-semibold text-center" style={{ color: "var(--text-muted)" }}>Favoritos</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Shield className="w-4 h-4" style={{ color: mc.color }} />
            <span className="text-[10px] font-semibold text-center" style={{ color: "var(--text-muted)" }}>Seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
