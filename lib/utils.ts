import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateEngagementRate(metrics: { likes?: number | null; comments?: number | null; shares?: number | null; followers?: number | null }) {
  const l = metrics.likes || 0;
  const c = metrics.comments || 0;
  const s = metrics.shares || 0;
  const f = metrics.followers || 0;
  
  if (!f || f === 0) return 0;
  return ((l + c + s) / f) * 100;
}
