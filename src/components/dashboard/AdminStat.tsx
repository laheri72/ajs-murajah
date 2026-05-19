import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function AdminStat({
  label,
  value,
  helper,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "rounded-md p-2",
              tone === "success" && "bg-emerald-50 text-primary",
              tone === "warning" && "bg-amber-50 text-amber-700",
              tone === "default" && "bg-gold-soft text-primary",
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
