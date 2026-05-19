import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "border-border bg-muted text-muted-foreground",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-primary",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {children}
    </span>
  );
}
