import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatActivityTitle(action: string, details?: Record<string, unknown>) {
  if (action === "room_progress_session_updated" && typeof details?.summary === "string") {
    return details.summary;
  }
  return action.replaceAll("_", " ");
}
