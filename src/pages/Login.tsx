import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Music, ArrowLeft, Shield, Sparkles, Mail, Lock, User, Loader2, LogIn, UserPlus, Check, X, Eye, EyeOff,
} from "lucide-react";

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

// Password requirement indicator
function PasswordRequirements({ password }: { password: string }) {
  const reqs = [
    { label: "8 caracteres", met: password.length >= 8 },
    { label: "1 maiuscula", met: /[A-Z]/.test(password) },
    { label: "1 minuscula", met: /[a-z]/.test(password) },
    { label: "1 numero", met: /[0-9]/.test(password) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {reqs.map((r) => (
        <span
          key={r.label}
          className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
          style={{
            background: r.met ? "rgba(0,255,157,0.1)" : "rgba(255,255,255,0.05)",
            color: r.met ? "#00ff9d" : "var(--text-muted)",
            border: `1px solid ${r.met ? "rgba(0,255,157,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {r.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {r.label}
        </span>
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const mc = { color: "#888", color2: "#555", glow: "rgba(80,80,80,0.3)" };
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showConfirmationMsg, setShowConfirmationMsg] = useState(false);
  const [confirmationLink, setConfirmationLink] = useState("");

  const { data: googleUrl } = trpc.googleAuth.getUrl.useQuery(undefined, { enabled: !isAuthenticated });

  // Password strength
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthLabel = ["Muito fraca", "Fraca", "Media", "Forte", "Muito forte", "Excelente"][passwordStrength];
  const strengthColor = ["#ff4444", "#ff7b00", "#ffd60a", "#00ff9d", "#00d4ff", "#00ff9d"][passwordStrength];

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
      toast.success("Conta criada! Confirma o teu email.");
      if (data.confirmationLink) {
        setConfirmationLink(data.confirmationLink);
        setShowConfirmationMsg(true);
      }
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
      if (password !== confirmPassword) {
        toast.error("As senhas nao coincidem");
        return;
      }
      registerMutation.mutate({ name, email, password, confirmPassword });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--bg-deep)" }}>
      <Button variant="ghost" onClick={() => navigate("/")} className="absolute top-6 left-4" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 0 40px ${mc.glow}` }}>
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">
            {showConfirmationMsg ? "Confirma o Email" : mode === "login" ? "Entrar" : "Criar Conta"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {showConfirmationMsg
              ? "Enviamos um link para o teu email"
              : mode === "login"
              ? "Entra na tua conta para continuar"
              : "Cria uma conta gratuita"}
          </p>
        </div>

        {/* Confirmation Message */}
        {showConfirmationMsg && (
          <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(0,255,157,0.05)", border: "1px solid rgba(0,255,157,0.2)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              A tua conta foi criada! Para ativa-la, clica no link que enviamos para:
            </p>
            <p className="text-sm font-bold mb-3" style={{ color: "#00ff9d" }}>{email}</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              (Na versao de teste, o link aparece abaixo)
            </p>
            {confirmationLink && (
              <a
                href={confirmationLink}
                className="text-xs px-4 py-2 rounded-full inline-block"
                style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
              >
                Confirmar Email
              </a>
            )}
            <button
              onClick={() => { setShowConfirmationMsg(false); setMode("login"); }}
              className="block mx-auto mt-3 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Ja confirmaste? Entrar
            </button>
          </div>
        )}

        {!showConfirmationMsg && (
          <>
            {/* Google OAuth */}
            <button
              onClick={() => googleUrl?.url ? window.location.href = googleUrl.url : toast.error("Google login nao configurado")}
              className="btn-lift w-full flex items-center justify-center gap-3 h-12 rounded-xl text-sm font-bold bg-white text-gray-800 hover:bg-gray-100"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
            >
              <GoogleIcon className="w-5 h-5" /> Entrar com Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ou com email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[20px] p-6" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: `1px solid color-mix(in srgb, ${mc.color} 15%, rgba(255,255,255,0.08))` }}>
              {mode === "register" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="O teu nome" required className="pl-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20" style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teu@email.com" required className="pl-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20" style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minimo 8 caracteres" : "A tua senha"}
                    required
                    className="pl-10 pr-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20"
                    style={{ borderColor: `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))` }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "register" && password.length > 0 && (
                  <>
                    <PasswordRequirements password={password} />
                    {/* Strength bar */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(passwordStrength / 5) * 100}%`, background: strengthColor }} />
                      </div>
                      <span className="text-[10px]" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  </>
                )}
              </div>

              {mode === "register" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mc.color }} />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repete a senha"
                      required
                      className="pl-10 pr-10 h-11 rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-white/20"
                      style={{
                        borderColor: confirmPassword && password !== confirmPassword
                          ? "rgba(255,68,68,0.5)"
                          : confirmPassword && password === confirmPassword
                          ? "rgba(0,255,157,0.5)"
                          : `color-mix(in srgb, ${mc.color} 20%, rgba(255,255,255,0.1))`,
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs" style={{ color: "#ff4444" }}>As senhas nao coincidem</p>
                  )}
                  {confirmPassword && password === confirmPassword && password.length > 0 && (
                    <p className="text-xs flex items-center gap-1" style={{ color: "#00ff9d" }}><Check className="w-3 h-3" /> Senhas coincidem</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || (mode === "register" && password !== confirmPassword)}
                className="btn-lift w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 4px 20px ${mc.glow}` }}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? <><LogIn className="w-4 h-4" /> Entrar</> : <><UserPlus className="w-4 h-4" /> Criar Conta</>}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="text-center">
              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-sm font-semibold hover:underline" style={{ color: mc.color }}>
                {mode === "login" ? "Nao tens conta? Cria uma" : "Ja tens conta? Entra aqui"}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Sparkles className="w-4 h-4" />, label: "Moods" },
                { icon: <Music className="w-4 h-4" />, label: "Favoritos" },
                { icon: <Shield className="w-4 h-4" />, label: "Seguro" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: mc.color }}>{f.icon}</span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{f.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
