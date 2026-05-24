import { useRef, useCallback } from "react";
import { getMoodColors } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareImageProps {
  title: string;
  artist: string;
  image?: string;
  mood?: string;
}

export default function ShareImage({ title, artist, image, mood }: ShareImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mc = mood ? getMoodColors(mood) : getMoodColors(null);

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Instagram story size (9:16)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a0a0f");
    grad.addColorStop(0.5, "#0f0f1a");
    grad.addColorStop(1, "#1a0a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Glow circles
    ctx.save();
    ctx.globalAlpha = 0.15;
    const glow = ctx.createRadialGradient(W/2, H/3, 0, W/2, H/3, 400);
    glow.addColorStop(0, mc.color);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Border frame
    ctx.strokeStyle = mc.color + "40";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Small corner accents
    ctx.fillStyle = mc.color;
    ctx.fillRect(30, 30, 60, 6);
    ctx.fillRect(30, 30, 6, 60);
    ctx.fillRect(W - 90, H - 36, 60, 6);
    ctx.fillRect(W - 36, H - 90, 6, 60);

    // Logo text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MoodTrack", W / 2, 180);

    // Divider line
    ctx.strokeStyle = mc.color + "60";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, 210);
    ctx.lineTo(W / 2 + 100, 210);
    ctx.stroke();

    // "Musica do Dia" label
    ctx.fillStyle = mc.color;
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("MUSICA DO DIA", W / 2, 300);

    // Album image placeholder or loaded image
    const imgY = 400;
    const imgSize = 500;
    const imgX = (W - imgSize) / 2;

    if (image) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = image;
        });
        if (img.complete && img.naturalWidth > 0) {
          // Rounded rect clip
          ctx.save();
          const r = 30;
          ctx.beginPath();
          ctx.moveTo(imgX + r, imgY);
          ctx.lineTo(imgX + imgSize - r, imgY);
          ctx.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + r);
          ctx.lineTo(imgX + imgSize, imgY + imgSize - r);
          ctx.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - r, imgY + imgSize);
          ctx.lineTo(imgX + r, imgY + imgSize);
          ctx.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - r);
          ctx.lineTo(imgX, imgY + r);
          ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
          ctx.restore();

          // Border around image
          ctx.strokeStyle = mc.color + "50";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(imgX + r, imgY);
          ctx.lineTo(imgX + imgSize - r, imgY);
          ctx.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + r);
          ctx.lineTo(imgX + imgSize, imgY + imgSize - r);
          ctx.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - r, imgY + imgSize);
          ctx.lineTo(imgX + r, imgY + imgSize);
          ctx.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - r);
          ctx.lineTo(imgX, imgY + r);
          ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY);
          ctx.closePath();
          ctx.stroke();
        }
      } catch {
        // Draw placeholder
        drawPlaceholder(ctx, imgX, imgY, imgSize, mc.color);
      }
    } else {
      drawPlaceholder(ctx, imgX, imgY, imgSize, mc.color);
    }

    // Song title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    // Word wrap title
    wrapText(ctx, title, W / 2, imgY + imgSize + 100, W - 120, 70);

    // Artist
    ctx.fillStyle = "#a0a0b8";
    ctx.font = "40px sans-serif";
    ctx.fillText(artist, W / 2, imgY + imgSize + 220);

    // Mood tag
    if (mood) {
      ctx.fillStyle = mc.color + "25";
      ctx.strokeStyle = mc.color + "60";
      ctx.lineWidth = 2;
      const tagW = 200;
      const tagH = 50;
      const tagX = (W - tagW) / 2;
      const tagY = imgY + imgSize + 280;
      roundRect(ctx, tagX, tagY, tagW, tagH, 25);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mc.color;
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(mood.toUpperCase(), W / 2, tagY + 34);
    }

    // Bottom URL
    ctx.fillStyle = "#606070";
    ctx.font = "28px sans-serif";
    ctx.fillText("mood-track.net", W / 2, H - 120);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moodtrack-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Imagem guardada! Partilha no Instagram/WhatsApp");
    }, "image/png");
  }, [title, artist, image, mood, mc.color]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <Button
        onClick={generateImage}
        variant="outline"
        size="sm"
        className="rounded-full text-xs"
        style={{ borderColor: mc.color + "40", color: mc.color }}
      >
        <ImageIcon className="w-3.5 h-3.5 mr-1" />
        Criar Imagem
      </Button>
    </>
  );
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color + "15";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = color + "30";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, size, size);

  // Music note icon
  ctx.fillStyle = color + "40";
  ctx.font = "200px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u266B", x + size / 2, y + size / 2);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
