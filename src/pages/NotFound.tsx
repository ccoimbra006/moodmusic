import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowLeft, Music } from "lucide-react";
import { useCurrentMood } from "@/hooks/useMood";
import { getMoodColors } from "@/lib/moods";

export default function NotFound() {
  const currentMood = useCurrentMood();
  const mc = getMoodColors(currentMood);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 0 30px ${mc.glow}` }}
        >
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gradient mb-2">404</h1>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>Pagina nao encontrada</p>
        <Button asChild className="rounded-full px-6 py-3 font-bold text-black transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${mc.color}, ${mc.color2})`, boxShadow: `0 4px 20px ${mc.glow}` }}
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
