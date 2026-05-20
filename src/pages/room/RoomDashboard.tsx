import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock, RotateCcw, Save, Target, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { RubGrid } from "../../components/quran/RubGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";
import { apiFetch } from "../../lib/api";
import { RUB_PER_JUZ, TOTAL_JUZ, TOTAL_RUB } from "../../lib/quran";
import { formatActivityTitle, formatDateTime, formatPercent } from "../../lib/utils";
import type { RoomDashboardData } from "../../types/domain";

export function RoomDashboard() {
  const queryClient = useQueryClient();
  const pendingMutationCount = useRef(0);
  const serverMutationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedRub, setSelectedRub] = useState<number[]>([]);
  const [savingRub, setSavingRub] = useState<number[]>([]);

  const dashboard = useQuery({
    queryKey: ["room-dashboard"],
    queryFn: () => apiFetch<RoomDashboardData>("/api/room/dashboard"),
  });

  const progress = useMutation({
    mutationFn: (rubNumbers: number[]) => {
      const run = serverMutationQueue.current
        .catch(() => undefined)
        .then(() => apiFetch<RoomDashboardData>("/api/room/progress", { method: "POST", body: JSON.stringify({ rubNumbers }) }));
      serverMutationQueue.current = run.catch(() => undefined);
      return run;
    },
    onMutate: async (rubNumbers) => {
      pendingMutationCount.current += 1;
      setSavingRub((current) => [...new Set([...current, ...rubNumbers])]);
      await queryClient.cancelQueries({ queryKey: ["room-dashboard"] });
      const previous = queryClient.getQueryData<RoomDashboardData>(["room-dashboard"]);
      if (previous) {
        queryClient.setQueryData<RoomDashboardData>(["room-dashboard"], toggleDashboardRub(previous, rubNumbers));
      }
      return { previous };
    },
    onError: (_error, _rubNumbers, context) => {
      if (!context?.previous) return;
      if (pendingMutationCount.current <= 1) {
        queryClient.setQueryData(["room-dashboard"], context.previous);
        return;
      }
      queryClient.setQueryData<RoomDashboardData>(["room-dashboard"], (current) => (current ? toggleDashboardRub(current, _rubNumbers) : context.previous));
    },
    onSuccess: () => {
      setSelectedRub([]);
      setMultiSelect(false);
    },
    onSettled: (_data, _error, rubNumbers) => {
      pendingMutationCount.current = Math.max(0, pendingMutationCount.current - 1);
      setSavingRub((current) => current.filter((rub) => !rubNumbers.includes(rub)));
      if (pendingMutationCount.current === 0) {
        queryClient.invalidateQueries({ queryKey: ["room-dashboard"] });
      }
    },
  });

  const data = dashboard.data;
  const activity = useMemo(() => data?.activity ?? [], [data]);
  const completedSet = useMemo(() => new Set(data?.completedRub ?? []), [data?.completedRub]);
  const unlockedJuz = useMemo(() => {
    for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
      const start = (juz - 1) * RUB_PER_JUZ + 1;
      const rubs = Array.from({ length: RUB_PER_JUZ }, (_, index) => start + index);
      if (rubs.some((rub) => !completedSet.has(rub))) return juz;
    }
    return TOTAL_JUZ;
  }, [completedSet]);
  const lockedJuz = useMemo(
    () => Array.from({ length: TOTAL_JUZ }, (_, index) => index + 1).filter((juz) => juz > unlockedJuz),
    [unlockedJuz],
  );
  const lockedRub = useMemo(() => {
    const completedRub = data?.completedRub ?? [];
    return completedRub.filter((rub) => {
      const endOfJuz = Math.ceil(rub / RUB_PER_JUZ) * RUB_PER_JUZ;
      return completedRub.some((completed) => completed > endOfJuz);
    });
  }, [data?.completedRub]);
  const nextRub = useMemo(() => {
    for (let rub = 1; rub <= TOTAL_RUB; rub += 1) {
      const juz = Math.ceil(rub / RUB_PER_JUZ);
      if (juz === unlockedJuz && !completedSet.has(rub)) return rub;
    }
    return null;
  }, [completedSet, unlockedJuz]);
  const latestCompletedRub = data?.completedRub[data.completedRub.length - 1] ?? null;
  const selectedCount = selectedRub.length;
  const selectedCompleteCount = selectedRub.filter((rub) => !completedSet.has(rub)).length;
  const selectedUndoCount = selectedCount - selectedCompleteCount;
  const weeklyPercent = data ? Math.min(100, (data.stats.weeklyCompleted / Math.max(1, data.stats.weeklyTarget)) * 100) : 0;

  function handleRubClick(rub: number) {
    const juz = Math.ceil(rub / RUB_PER_JUZ);
    if (juz > unlockedJuz || lockedRub.includes(rub)) return;
    if (multiSelect) {
      setSelectedRub((current) => (current.includes(rub) ? current.filter((item) => item !== rub) : [...current, rub]));
      return;
    }
    progress.mutate([rub]);
  }

  function saveSelectedRub() {
    const allowedRub = selectedRub.filter((rub) => Math.ceil(rub / RUB_PER_JUZ) <= unlockedJuz && !lockedRub.includes(rub));
    if (allowedRub.length) progress.mutate(allowedRub);
  }

  function closeMultiSelect() {
    setMultiSelect(false);
    setSelectedRub([]);
  }

  if (dashboard.isLoading) return <LoadingState label="Loading room progress..." />;
  if (dashboard.isError || !data) return <EmptyState title="Room dashboard unavailable" description="Refresh the page or sign in again." />;

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-soft">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#064e3b,#047857_54%,#0f766e)] p-5 text-white lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-50">
              <span className="rounded-full bg-white/15 px-3 py-1">{data.room.floor?.name ?? "No floor assigned"}</span>
              <span className="rounded-full bg-white/15 px-3 py-1">{data.room.member_count} members</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">{data.room.name}</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={`${data.stats.totalCompleted}/${data.stats.totalTarget}`} />
              <HeroStat icon={<Target className="h-4 w-4" />} label="Remaining" value={data.stats.remainingTarget} />
              <HeroStat icon={<Clock className="h-4 w-4" />} label="This week" value={`${data.stats.weeklyCompleted}/${data.stats.weeklyTarget}`} />
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-lg bg-white/12 p-4 backdrop-blur sm:justify-between lg:grid lg:place-items-center">
            <div
              className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(#f2c75c ${data.stats.completionPercentage * 3.6}deg, rgba(255,255,255,0.18) 0deg)` }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-primary text-center">
                <span className="text-2xl font-bold">{formatPercent(data.stats.completionPercentage)}</span>
              </div>
            </div>
            <div className="min-w-0 lg:text-center">
              <p className="text-sm text-emerald-50">Overall target</p>
              <p className="mt-1 text-lg font-semibold">{data.stats.totalCompleted} Rub' done</p>
              <div className="mt-4 flex flex-wrap gap-2 lg:justify-center">
                {nextRub ? (
                  <Button className="bg-white text-primary hover:bg-emerald-50" disabled={progress.isPending} onClick={() => progress.mutate([nextRub])}>
                    Rub {nextRub}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
                {latestCompletedRub ? (
                  <Button variant="secondary" disabled={progress.isPending} onClick={() => progress.mutate([latestCompletedRub])}>
                    <RotateCcw className="h-4 w-4" />
                    Undo
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_240px]">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Weekly target</span>
              <span className="text-muted-foreground">{data.stats.weeklyCompleted}/{data.stats.weeklyTarget} Rub'</span>
            </div>
            <Progress value={weeklyPercent} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniStat label="Next Rub" value={nextRub ?? "Done"} />
            <MiniStat label="Progress" value={formatPercent(data.stats.completionPercentage)} />
          </div>
        </div>
      </section>

      <Card className="p-0">
        <CardHeader className="sticky top-[69px] z-10 mb-0 items-center border-b border-border bg-white/95 p-4 backdrop-blur">
          <div>
            <CardTitle>Rub' Wise tracking</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {multiSelect ? `${selectedCount} selected` : `complete Juz ${unlockedJuz} to unlock the next Juz`}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {multiSelect ? (
              <Button variant="ghost" size="icon" onClick={closeMultiSelect} aria-label="Close multi-select">
                <X className="h-5 w-5" />
              </Button>
            ) : null}
            <Button variant={multiSelect ? "primary" : "secondary"} onClick={() => (multiSelect ? saveSelectedRub() : setMultiSelect(true))} disabled={(multiSelect && !selectedCount) || progress.isPending}>
              {multiSelect ? <Save className="h-4 w-4" /> : null}
              {multiSelect ? `Save ${selectedCount}` : "Select"}
            </Button>
          </div>
        </CardHeader>
        <div className="p-4">
          {multiSelect && selectedCount ? (
            <div className="mb-4 grid gap-2 rounded-lg border border-gold bg-gold-soft p-3 text-sm sm:grid-cols-3">
              <MiniStat label="Complete" value={selectedCompleteCount} />
              <MiniStat label="Undo" value={selectedUndoCount} />
              <MiniStat label="Selected" value={selectedCount} />
            </div>
          ) : null}
          {progress.isError ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{progress.error.message}</p> : null}
          <RubGrid completedRub={data.completedRub} selectedRub={selectedRub} multiSelect={multiSelect} lockedJuz={lockedJuz} lockedRub={lockedRub} savingRub={savingRub} onRubClick={handleRubClick} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <div className="divide-y divide-border">
          {activity.length ? (
            activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{formatActivityTitle(item.action, item.details)}</p>
                  <p className="text-xs text-muted-foreground">{item.actor_label}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No activity yet" description="Completed Rub' units will appear here." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function toggleDashboardRub(data: RoomDashboardData, rubNumbers: number[]) {
  const next = new Set(data.completedRub);
  rubNumbers.forEach((rub) => (next.has(rub) ? next.delete(rub) : next.add(rub)));
  const totalCompleted = next.size;
  const totalTarget = data.stats.totalTarget || TOTAL_RUB;
  return {
    ...data,
    completedRub: [...next].sort((a, b) => a - b),
    stats: {
      ...data.stats,
      totalCompleted,
      completionPercentage: Math.min(100, (totalCompleted / totalTarget) * 100),
      remainingTarget: Math.max(0, data.stats.totalTarget - totalCompleted),
    },
  };
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-white/12 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-emerald-50">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}
