import type { ReactNode } from "react";
import { Card } from "../ui/Card";

export function MetricCard({ label, value, helper, icon }: { label: string; value: ReactNode; helper?: string; icon?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        {icon ? <div className="rounded-md bg-gold-soft p-2 text-primary">{icon}</div> : null}
      </div>
    </Card>
  );
}
