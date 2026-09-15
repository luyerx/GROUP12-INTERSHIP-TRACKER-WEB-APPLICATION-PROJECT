"use client";
import { ArrowUpRight } from "lucide-react";

export function resourceDestination(value: string | undefined, origin: string): string | null {
  if (!value?.trim()) return null;
  try {
    // Resources currently expose external URLs only; there is no detail API.
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.origin === origin && url.pathname.replace(/\/+$/, '') === '/resources') return null;
    return url.href;
  } catch { return null; }
}

export default function ResourceLink({ url, title, origin }: { url?: string; title: string; origin: string }) {
  const href = resourceDestination(url, origin);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800" aria-label={'Open ' + title + ' (opens in a new tab)'}>
      Open resource <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
    </a>
  ) : <span className="text-xs leading-5 text-slate-600">Resource link unavailable</span>;
}
