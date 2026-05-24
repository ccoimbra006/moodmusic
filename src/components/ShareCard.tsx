import { useRef, useCallback } from "react";
import { getMoodColors } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
  title: string;
  artist: string;
  image?: string;
  mood?: string;
}

export default function ShareCard({ title, artist, image, mood }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mc = mood ? getMoodColors(mood) : getMoodColors(null);

  const handleShare = useCallback(async () => {
    const text = `🎵 Musica do Dia no MoodTrack\n\n"${title}" - ${artist}\n\nDescobre em mood-track.net`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "MoodTrack", text });
        return;
      } catch { /* fallback */ }
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado para a area de transferencia!");
  }, [title, artist]);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleShare}
        variant="outline"
        size="sm"
        className="rounded-full text-xs"
        style={{ borderColor: mc.color, color: mc.color }}
      >
        <Share2 className="w-3.5 h-3.5 mr-1" />
        Partilhar
      </Button>
    </div>
  );
}
