import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RubGrid } from "../../components/quran/RubGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";
import { apiFetch } from "../../lib/api";
import { RUB_PER_JUZ, TOTAL_JUZ, TOTAL_RUB } from "../../lib/quran";
import { cn, formatActivityTitle, formatDateTime, formatPercent } from "../../lib/utils";
import { useProgressSyncStore } from "../../stores/progress-sync-store";
import type { RoomDashboardData } from "../../types/domain";

export function RoomDashboard() {
  const queryClient = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlight = useRef(false);
  const pendingSync = useRef(false);
  const hasUnsavedChanges = useRef(false);
  const latestCompletedRub = useRef<number[]>([]);
  const lastSavedCompletedRub = useRef<number[]>([]);
  const flushSyncRef = useRef<() => void>(() => undefined);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedRub, setSelectedRub] = useState<number[]>([]);
  const [localCompletedRub, setLocalCompletedRub] = useState<number[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [completionCue, setCompletionCue] = useState<{ rubNumber: number; label: string } | null>(null);
  const setRoomProgressSaving = useProgressSyncStore((state) => state.setRoomProgressSaving);

  const dashboard = useQuery({
    queryKey: ["room-dashboard"],
    queryFn: () => apiFetch<RoomDashboardData>("/api/room/dashboard"),
  });

  const serverData = dashboard.data;

  useEffect(() => {
    if (!serverData || hasUnsavedChanges.current || syncInFlight.current) return;
    latestCompletedRub.current = serverData.completedRub;
    lastSavedCompletedRub.current = serverData.completedRub;
    setLocalCompletedRub(serverData.completedRub);
  }, [serverData]);

  useEffect(() => {
    flushSyncRef.current = flushProgressSync;
  });

  useEffect(() => {
    function flushBeforeLeaving() {
      if (document.visibilityState === "hidden" && hasUnsavedChanges.current) {
        flushSyncRef.current();
      }
    }

    document.addEventListener("visibilitychange", flushBeforeLeaving);
    return () => {
      document.removeEventListener("visibilitychange", flushBeforeLeaving);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (cueTimer.current) clearTimeout(cueTimer.current);
    };
  }, []);

  const completedRub = useMemo(() => localCompletedRub ?? serverData?.completedRub ?? [], [localCompletedRub, serverData?.completedRub]);
  const data = useMemo(
    () => (serverData ? withCompletedRub(serverData, completedRub, lastSavedCompletedRub.current) : undefined),
    [serverData, completedRub],
  );
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
  const activeJuzUnits = useMemo(
    () =>
      Array.from({ length: RUB_PER_JUZ }, (_, index) => {
        const rubNumber = (unlockedJuz - 1) * RUB_PER_JUZ + index + 1;
        return {
          rubNumber,
          juzNumber: unlockedJuz,
          rubInJuz: index + 1,
        };
      }),
    [unlockedJuz],
  );
  const nextRubUnit = useMemo(
    () =>
      nextRub
        ? {
            rubNumber: nextRub,
            juzNumber: Math.ceil(nextRub / RUB_PER_JUZ),
            rubInJuz: ((nextRub - 1) % RUB_PER_JUZ) + 1,
          }
        : null,
    [nextRub],
  );
  const activeJuzCompletedCount = activeJuzUnits.filter((unit) => completedSet.has(unit.rubNumber)).length;
  const completedJuzList = useMemo(() => {
    return Array.from({ length: TOTAL_JUZ }, (_, index) => index + 1).filter((juz) => {
      const start = (juz - 1) * RUB_PER_JUZ + 1;
      return Array.from({ length: RUB_PER_JUZ }, (_, offset) => start + offset).every((rub) => completedSet.has(rub));
    });
  }, [completedSet]);
  const latestCompletedRubNumber = data?.completedRub[data.completedRub.length - 1] ?? null;
  const selectedCount = selectedRub.length;
  const selectedCompleteCount = selectedRub.filter((rub) => !completedSet.has(rub)).length;
  const selectedUndoCount = selectedCount - selectedCompleteCount;
  const weeklyPercent = data ? Math.min(100, (data.stats.weeklyCompleted / Math.max(1, data.stats.weeklyTarget)) * 100) : 0;
  const completedJuz = data ? Math.floor(data.stats.totalCompleted / RUB_PER_JUZ) : 0;
  const targetJuz = data ? Math.ceil(data.stats.totalTarget / RUB_PER_JUZ) : TOTAL_JUZ;
  const latestActivity = activity[0] ?? null;
  const lastUpdatedLabel = latestActivity ? formatDateTime(latestActivity.created_at) : "No recent activity";

  function scheduleProgressSync(nextCompletedRub: number[], delay = 800) {
    const sorted = sortRub(nextCompletedRub);
    latestCompletedRub.current = sorted;
    hasUnsavedChanges.current = true;
    setRoomProgressSaving(true);
    setSyncError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flushProgressSync();
    }, delay);
  }

  function showCompletionCue(rubNumber: number) {
    if (cueTimer.current) clearTimeout(cueTimer.current);
    setCompletionCue({ rubNumber, label: `Rub ${rubNumber} completed` });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    cueTimer.current = setTimeout(() => {
      setCompletionCue(null);
    }, 1600);
  }

  async function flushProgressSync() {
    if (!hasUnsavedChanges.current) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (syncInFlight.current) {
      pendingSync.current = true;
      return;
    }

    const payload = latestCompletedRub.current;
    syncInFlight.current = true;
    setIsSyncing(true);
    try {
      const syncedData = await apiFetch<RoomDashboardData>("/api/room/progress", {
        method: "POST",
        body: JSON.stringify({ completedRub: payload }),
      });
      queryClient.setQueryData(["room-dashboard"], syncedData);
      lastSavedCompletedRub.current = syncedData.completedRub;

      if (arraysEqual(payload, latestCompletedRub.current)) {
        hasUnsavedChanges.current = false;
        setLocalCompletedRub(syncedData.completedRub);
        setRoomProgressSaving(false);
      } else {
        pendingSync.current = true;
      }
    } catch (error) {
      hasUnsavedChanges.current = false;
      const message = error instanceof Error ? error.message : "Could not save progress";
      setSyncError(message);
      const refreshed = await dashboard.refetch();
      if (refreshed.data) {
        latestCompletedRub.current = refreshed.data.completedRub;
        lastSavedCompletedRub.current = refreshed.data.completedRub;
        setLocalCompletedRub(refreshed.data.completedRub);
      }
    } finally {
      syncInFlight.current = false;
      if (pendingSync.current && !arraysEqual(lastSavedCompletedRub.current, latestCompletedRub.current)) {
        pendingSync.current = false;
        flushProgressSync();
      } else {
        pendingSync.current = false;
        setIsSyncing(false);
        setRoomProgressSaving(false);
      }
    }
  }

  function applyLocalRubChange(rubNumbers: number[], flushDelay = 800) {
    setLocalCompletedRub((current) => {
      const previous = current ?? data?.completedRub ?? [];
      const next = toggleRubNumbers(previous, rubNumbers);
      const addedRub = next.find((rub) => !previous.includes(rub) && rubNumbers.includes(rub));
      if (addedRub) showCompletionCue(addedRub);
      scheduleProgressSync(next, flushDelay);
      return next;
    });
  }

  function handleRubClick(rub: number) {
    const juz = Math.ceil(rub / RUB_PER_JUZ);
    if (juz > unlockedJuz || lockedRub.includes(rub)) return;
    if (multiSelect) {
      setSelectedRub((current) => (current.includes(rub) ? current.filter((item) => item !== rub) : [...current, rub]));
      return;
    }
    applyLocalRubChange([rub]);
  }

  function saveSelectedRub() {
    const allowedRub = selectedRub.filter((rub) => Math.ceil(rub / RUB_PER_JUZ) <= unlockedJuz && !lockedRub.includes(rub));
    if (allowedRub.length) {
      applyLocalRubChange(allowedRub, 0);
      setSelectedRub([]);
      setMultiSelect(false);
    }
  }

  function closeMultiSelect() {
    setMultiSelect(false);
    setSelectedRub([]);
  }

  if (dashboard.isLoading) return <RoomDashboardSkeleton />;
  if (dashboard.isError || !data) return <EmptyState title="Room dashboard unavailable" description="Refresh the page or sign in again." />;

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-soft">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#064e3b,#047857_54%,#0f766e)] p-5 text-white lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-50">
              <span className="rounded-full bg-white/15 px-3 py-1">{data.room.floor?.name ?? "No floor assigned"}</span>
              <span className="rounded-full bg-white/15 px-3 py-1">{data.room.member_count} members</span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-emerald-100">Active queue</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">{data.room.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">
              {nextRubUnit
                ? `You are in Juz ${unlockedJuz}. The next action is Juz ${nextRubUnit.juzNumber} • Rub ${nextRubUnit.rubInJuz}.`
                : "All Rub' are complete. Use Undo or review recent activity if you need to adjust progress."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(240px,290px)]">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Current active Juz</p>
                    <p className="mt-1 text-3xl font-bold">Juz {unlockedJuz}</p>
                    <p className="mt-1 text-sm text-emerald-50">{activeJuzCompletedCount}/4 Rub' completed in this Juz</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Focus Rub</p>
                    <p className="mt-1 text-2xl font-semibold">{nextRubUnit ? `Rub ${nextRubUnit.rubInJuz}` : "Done"}</p>
                    <p className="text-sm text-emerald-50">{nextRubUnit ? `Juz ${nextRubUnit.juzNumber}` : "All complete"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {activeJuzUnits.map((unit) => {
                    const isComplete = completedSet.has(unit.rubNumber);
                    const isNext = nextRub === unit.rubNumber;
                    return (
                      <button
                        key={unit.rubNumber}
                        type="button"
                        onClick={() => handleRubClick(unit.rubNumber)}
                        disabled={multiSelect}
                        className={cn(
                          "flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-semibold transition",
                          isComplete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : isNext
                              ? "border-primary bg-white text-primary shadow-sm"
                              : "border-white/15 bg-white/5 text-emerald-50 hover:bg-white/10",
                          multiSelect && "cursor-default opacity-90",
                        )}
                        aria-label={`Juz ${unit.juzNumber}, Rub ${unit.rubInJuz}`}
                        title={isComplete ? "Completed" : isNext ? "Next Rub" : `Rub ${unit.rubNumber}`}
                      >
                        <span className="text-base">{isComplete ? <CheckCircle2 className="h-4 w-4" /> : unit.rubInJuz}</span>
                        <span className={cn("mt-1 text-[10px] font-medium", isComplete ? "text-emerald-700" : "text-inherit/80")}>Rub</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">One-tap action</p>
                <Button
                  className="mt-3 w-full justify-between bg-white text-primary hover:bg-emerald-50"
                  onClick={() => (nextRub ? applyLocalRubChange([nextRub]) : undefined)}
                  disabled={multiSelect || !nextRub}
                >
                  <span>{nextRub ? `Complete Rub ${nextRubUnit?.rubInJuz ?? nextRub}` : "All Rub' completed"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {latestCompletedRubNumber ? (
                    <Button variant="secondary" onClick={() => applyLocalRubChange([latestCompletedRubNumber])}>
                      <RotateCcw className="h-4 w-4" />
                      Undo
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      <RotateCcw className="h-4 w-4" />
                      Undo
                    </Button>
                  )}
                  <Button
                    variant={multiSelect ? "primary" : "secondary"}
                    onClick={() => (multiSelect ? (selectedCount ? saveSelectedRub() : closeMultiSelect()) : setMultiSelect(true))}
                  >
                    {multiSelect ? <Save className="h-4 w-4" /> : null}
                    {multiSelect ? (selectedCount ? `Save ${selectedCount}` : "Close") : "Select"}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-50">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last updated {lastUpdatedLabel}</span>
                </div>
                {syncError ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{syncError}</p> : null}
                {isSyncing ? <p className="mt-2 text-xs text-emerald-50">Saving changes...</p> : null}
              </div>
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
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <div className="rounded-lg bg-white/12 p-3">
                  <p className="text-xs text-emerald-100">Juz completed</p>
                  <p className="mt-1 text-lg font-semibold">
                    {completedJuz} of {TOTAL_JUZ}
                  </p>
                </div>
                <div className="rounded-lg bg-white/12 p-3">
                  <p className="text-xs text-emerald-100">Target Juz</p>
                  <p className="mt-1 text-lg font-semibold">{targetJuz}</p>
                </div>
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

      {completionCue ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[min(92vw,20rem)] -translate-x-1/2 sm:left-auto sm:right-4 sm:top-5 sm:translate-x-0">
          <div className="rounded-[1.35rem] border border-white/40 bg-white/70 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl ring-1 ring-white/50 transition-all duration-300 ease-out">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-700 shadow-inner shadow-white/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Completed</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{completionCue.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Nice. One more small step kept the streak moving.</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-500 transition-transform duration-[1600ms] ease-linear" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      ) : null}

      <details className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none">
          <div>
            <CardTitle>Completed archive</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{completedJuzList.length} completed Juz collapsed out of the active flow</p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">{completedJuzList.length}</div>
        </summary>
        <div className="border-t border-border p-4">
          {completedJuzList.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {completedJuzList.map((juzNumber) => (
                <div key={juzNumber} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  Juz {juzNumber}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No completed Juz yet" description="Completed Juz will move here automatically." />
          )}
        </div>
      </details>

      <details className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none">
          <div>
            <CardTitle>Browse full Quran structure</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Expandable reference view for advanced browsing and bulk updates</p>
          </div>
          <div className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground">{TOTAL_JUZ} Juz</div>
        </summary>
        <div className="border-t border-border p-4">
          {multiSelect && selectedCount ? (
            <div className="mb-4 grid gap-2 rounded-lg border border-gold bg-gold-soft p-3 text-sm sm:grid-cols-3">
              <MiniStat label="Complete" value={selectedCompleteCount} />
              <MiniStat label="Undo" value={selectedUndoCount} />
              <MiniStat label="Selected" value={selectedCount} />
            </div>
          ) : null}
          <div className="max-h-[72vh] overflow-auto pr-1">
            <RubGrid completedRub={data.completedRub} selectedRub={selectedRub} multiSelect={multiSelect} lockedJuz={lockedJuz} lockedRub={lockedRub} savingRub={[]} onRubClick={handleRubClick} />
          </div>
        </div>
      </details>

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

function toggleRubNumbers(completedRub: number[], rubNumbers: number[]) {
  const next = new Set(completedRub);
  rubNumbers.forEach((rub) => (next.has(rub) ? next.delete(rub) : next.add(rub)));
  return sortRub([...next]);
}

function withCompletedRub(data: RoomDashboardData, completedRub: number[], lastSavedRub: number[]) {
  const totalCompleted = completedRub.length;
  const totalTarget = data.stats.totalTarget || TOTAL_RUB;
  const newlyCompleted = completedRub.filter((rub) => !lastSavedRub.includes(rub)).length;
  return {
    ...data,
    completedRub,
    stats: {
      ...data.stats,
      totalCompleted,
      completionPercentage: Math.min(100, (totalCompleted / totalTarget) * 100),
      weeklyCompleted: data.stats.weeklyCompleted + newlyCompleted,
      remainingTarget: Math.max(0, data.stats.totalTarget - totalCompleted),
    },
  };
}

function sortRub(numbers: number[]) {
  return [...numbers].sort((a, b) => a - b);
}

function arraysEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function RoomDashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
      <div className="h-[520px] animate-pulse rounded-xl bg-muted" />
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
