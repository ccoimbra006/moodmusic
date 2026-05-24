import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
  title: string;
  artist: string;
  image?: string;
  moodColor?: string;
}

export default function ShareCard({ title, artist, moodColor = "#00d4ff" }: ShareCardProps) {
  const handleShare = useCallback(async () => {
    const text = `\ud83c\udfb5 Musica do Dia no MoodTrack\n\n"${title}" - ${artist}\n\nDescobre em mood-track.net`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "MoodTrack", text });
        return;
      } catch { /* fallback */ }
    }

    await navigator.clipboard.writeText(text);
    toast.success("Link copiado para a area de transferencia!");
  }, [title, artist]);

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="rounded-full text-xs h-9 px-4"
      style={{ borderColor: moodColor + "40", color: moodColor }}
    >
      <Share2 className="w-4 h-4 mr-1.5" />
      Partilhar
    </Button>
  );
}
