import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  const diffD = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
