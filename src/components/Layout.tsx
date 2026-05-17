import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentMood } from "@/hooks/useMood";
import { getMoodColors } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Music, User, LogOut, Shield, Menu, X } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentMood = useCurrentMood();
  const mc = getMoodColors(currentMood);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen relative">
      {/* Header — glass real */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-3"
            : "py-4"
        }`}
        style={{
          background: scrolled
            ? "rgba(10,10,15,0.98)"
            : "rgba(10,10,15,0.92)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
          boxShadow: "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group btn-lift">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
                boxShadow: "none",
              }}
            >
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-gradient">
                MoodTrack
              </div>
              <div
                className="text-[9px] font-medium tracking-[2.5px] uppercase font-mono"
                style={{ color: mc.color, opacity: 0.7 }}
              >
                UMA MUSICA. UM MOOD. UM DIA.
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <span
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: mc.color, opacity: 0.6 }}
            >
              {new Date().toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="btn-lift text-xs"
                    style={{
                      color:
                        location.pathname === "/admin"
                          ? mc.color
                          : "rgba(240,240,240,0.6)",
                    }}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full p-0 btn-lift"
                    >
                      <Avatar
                        className="h-9 w-9"
                        style={{ border: `1.5px solid ${mc.color}` }}
                      >
                        <AvatarImage
                          src={user?.avatar ?? ""}
                          alt={user?.name ?? ""}
                        />
                        <AvatarFallback
                          className="text-white text-sm font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
                          }}
                        >
                          {(user?.name ?? "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(20px)",
                      border: `1px solid color-mix(in srgb, ${mc.color} 25%, rgba(255,255,255,0.1))`,
                    }}
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar ?? ""} />
                        <AvatarFallback
                          className="text-white text-xs font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
                          }}
                        >
                          {(user?.name ?? "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user?.name ?? "Usuario"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {user?.email ?? ""}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" /> Perfil
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" /> Painel Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logout();
                      }}
                      className="text-red-400 focus:text-red-400 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                className="btn-lift rounded-full px-5 py-2 text-sm font-bold text-black"
                style={{
                  background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
                  boxShadow: `0 4px 20px ${mc.glow}`,
                }}
              >
                Entrar
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-4 py-4 space-y-2"
            style={{
              background: `color-mix(in srgb, ${mc.color} 3%, rgba(10,10,15,0.98))`,
              backdropFilter: "blur(20px)",
              borderTop: `1px solid color-mix(in srgb, ${mc.color} 15%, rgba(255,255,255,0.05))`,
            }}
          >
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "rgba(240,240,240,0.7)" }}
              >
                <Shield className="w-4 h-4 inline mr-2" /> Painel Admin
              </button>
            )}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: "rgba(240,240,240,0.7)" }}
                >
                  <User className="w-4 h-4 inline mr-2" /> Perfil
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                >
                  <LogOut className="w-4 h-4 inline mr-2" /> Sair
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-bold text-black"
                style={{
                  background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`,
                }}
              >
                Entrar
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="pt-20">{children}</main>

      {/* Footer */}
      <footer
        className="text-center py-12 transition-colors duration-500"
        style={{
          borderTop: `1px solid color-mix(in srgb, ${mc.color} 12%, rgba(255,255,255,0.05))`,
        }}
      >
        <div
          className="text-base font-bold font-[Space_Grotesk]"
          style={{ color: mc.color }}
        >
          MoodTrack
        </div>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Uma musica. Um mood. Um dia. &copy; 2026
        </p>
      </footer>
    </div>
  );
}
