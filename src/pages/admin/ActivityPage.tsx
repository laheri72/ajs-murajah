import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Card, CardTitle } from "../../components/ui/Card";
import { apiFetch } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import type { ActivityLog } from "../../types/domain";

export function ActivityPage() {
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => apiFetch<ActivityLog[]>("/api/admin/activity") });

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Activity</h1>
      <Card>
        <CardTitle>Audit Log</CardTitle>
        <div className="mt-4 grid gap-3">
          {activity.isLoading ? <LoadingState /> : activity.data?.length ? activity.data.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <p className="font-medium">{item.actor_label} {item.action.replaceAll("_", " ")}</p>
              <p className="text-sm text-muted-foreground">{item.actor_role} · {formatDateTime(item.created_at)}</p>
            </div>
          )) : <EmptyState title="No activity yet" description="Room progress and admin changes will appear here." />}
        </div>
      </Card>
    </div>
  );
}
