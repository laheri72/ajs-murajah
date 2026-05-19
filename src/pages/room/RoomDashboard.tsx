import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { RubGrid } from "../../components/quran/RubGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";
import { apiFetch } from "../../lib/api";
import { TOTAL_RUB } from "../../lib/quran";
import { formatDateTime, formatPercent } from "../../lib/utils";
import type { RoomDashboardData } from "../../types/domain";

export function RoomDashboard() {
  const queryClient = useQueryClient();
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedRub, setSelectedRub] = useState<number[]>([]);

  const dashboard = useQuery({
    queryKey: ["room-dashboard"],
    queryFn: () => apiFetch<RoomDashboardData>("/api/room/dashboard"),
  });

  const progress = useMutation({
    mutationFn: (rubNumbers: number[]) => apiFetch<RoomDashboardData>("/api/room/progress", { method: "POST", body: JSON.stringify({ rubNumbers }) }),
    onMutate: async (rubNumbers) => {
      await queryClient.cancelQueries({ queryKey: ["room-dashboard"] });
      const previous = queryClient.getQueryData<RoomDashboardData>(["room-dashboard"]);
      if (previous) {
        const next = new Set(previous.completedRub);
        rubNumbers.forEach((rub) => (next.has(rub) ? next.delete(rub) : next.add(rub)));
        const totalCompleted = next.size;
        queryClient.setQueryData<RoomDashboardData>(["room-dashboard"], {
          ...previous,
          completedRub: [...next].sort((a, b) => a - b),
          stats: {
            ...previous.stats,
            totalCompleted,
            completionPercentage: (totalCompleted / (previous.stats.totalTarget || TOTAL_RUB)) * 100,
            remainingTarget: Math.max(0, previous.stats.totalTarget - totalCompleted),
          },
        });
      }
      return { previous };
    },
    onError: (_error, _rubNumbers, context) => {
      if (context?.previous) queryClient.setQueryData(["room-dashboard"], context.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["room-dashboard"], data);
      setSelectedRub([]);
      setMultiSelect(false);
    },
  });

  const data = dashboard.data;
  const selectedCount = selectedRub.length;
  const activity = useMemo(() => data?.activity ?? [], [data]);

  function handleRubClick(rub: number) {
    if (multiSelect) {
      setSelectedRub((current) => (current.includes(rub) ? current.filter((item) => item !== rub) : [...current, rub]));
      return;
    }
    progress.mutate([rub]);
  }

  if (dashboard.isLoading) return <LoadingState label="Loading room progress..." />;
  if (dashboard.isError || !data) return <EmptyState title="Room dashboard unavailable" description="Refresh the page or sign in again." />;

  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-primary p-5 text-white shadow-soft">
        <p className="text-sm text-emerald-100">{data.room.floor?.name ?? "No floor assigned"}</p>
        <h1 className="mt-1 text-3xl font-bold">{data.room.name}</h1>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Overall progress</span>
            <span>{formatPercent(data.stats.completionPercentage)}</span>
          </div>
          <Progress value={data.stats.completionPercentage} className="bg-emerald-900/40 [&>div]:bg-gold" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Completed" value={`${data.stats.totalCompleted}/${data.stats.totalTarget}`} helper="Rub’ units" icon={<CheckCircle2 className="h-5 w-5" />} />
        <MetricCard label="Weekly progress" value={data.stats.weeklyCompleted} helper={`Target ${data.stats.weeklyTarget} Rub’`} icon={<Clock className="h-5 w-5" />} />
        <MetricCard label="Remaining" value={data.stats.remainingTarget} helper="Rub’ to target" icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Members" value={data.room.member_count} helper="Room count" icon={<Users className="h-5 w-5" />} />
      </section>

      <Card>
        <CardHeader className="items-center">
          <div>
            <CardTitle>Quran Rub’ Tracker</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Tap once to save. Tap completed units to undo.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={multiSelect ? "primary" : "secondary"} onClick={() => setMultiSelect((value) => !value)}>
              Multi-select
            </Button>
            {multiSelect ? (
              <Button disabled={!selectedCount || progress.isPending} onClick={() => progress.mutate(selectedRub)}>
                Save {selectedCount || ""}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {progress.isError ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{progress.error.message}</p> : null}
        <RubGrid completedRub={data.completedRub} selectedRub={selectedRub} multiSelect={multiSelect} disabled={progress.isPending} onRubClick={handleRubClick} />
      </Card>

      <Card>
        <CardTitle>Recent Activity</CardTitle>
        <div className="mt-4 grid gap-3">
          {activity.length ? (
            activity.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{item.actor_label} {item.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <EmptyState title="No activity yet" description="Completed Rub’ units will appear here." />
          )}
        </div>
      </Card>
    </div>
  );
}
