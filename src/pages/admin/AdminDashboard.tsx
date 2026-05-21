import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Activity, BarChart3, Building2, CheckCircle2, DoorOpen, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Card, CardTitle } from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import { Progress } from "../../components/ui/Progress";
import { apiFetch } from "../../lib/api";
import { RUB_PER_JUZ } from "../../lib/quran";
import { cn } from "../../lib/utils";
import { formatActivityTitle, formatDateTime, formatPercent } from "../../lib/utils";
import type { AdminAnalytics, AdminRoomAnalytics, PaginatedActivityResponse, Room } from "../../types/domain";

export function AdminDashboard() {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<AdminAnalytics>("/api/admin/analytics"),
  });
  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<Room[]>("/api/admin/rooms"),
  });
  const activity = useQuery({
    queryKey: ["admin-activity", 1, 10, "all", ""],
    queryFn: () => apiFetch<PaginatedActivityResponse>("/api/admin/activity?page=1&limit=10"),
  });
  const roomAnalytics = useQuery({
    queryKey: ["admin-room-analytics", selectedRoomId],
    queryFn: () => apiFetch<AdminRoomAnalytics>(`/api/admin/analytics/room?roomId=${encodeURIComponent(selectedRoomId)}`),
    enabled: Boolean(selectedRoomId),
  });

  useEffect(() => {
    if (!selectedRoomId && rooms.data?.length) {
      setSelectedRoomId(rooms.data[0].id);
    }
  }, [rooms.data, selectedRoomId]);

  if (analytics.isLoading) return <AdminDashboardSkeleton />;
  if (analytics.isError || !analytics.data) return <EmptyState title="Analytics unavailable" description="Check your Supabase connection and try again." />;

  const data = analytics.data;
  const weeklyCompleted = data.weeklyTrend.reduce((sum, item) => sum + item.completed, 0);
  const roomsBehind = data.roomsBehindPreview;
  const topRooms = data.topRooms;
  const floorLeader = [...data.floorPerformance].sort((a, b) => b.completionPercentage - a.completionPercentage)[0];
  const completedJuz = data.totals.completedRub / RUB_PER_JUZ;
  const possibleJuz = data.totals.possibleRub / RUB_PER_JUZ;
  const selectedRoom = roomAnalytics.data;
  const weeklyPercentage = selectedRoom ? Math.min(100, (selectedRoom.weeklyCompleted / Math.max(1, selectedRoom.weeklyTarget)) * 100) : 0;

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Overview"
        description="A focused control center for Maskan-wide completion, rooms behind target, floor health, and recent updates."
        action={<StatusBadge tone={data.totals.roomsBehindTarget ? "warning" : "success"}>{data.totals.roomsBehindTarget ? `${data.totals.roomsBehindTarget} need follow-up` : "All rooms on track"}</StatusBadge>}
      />

      <section className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-soft">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#064e3b,#047857_56%,#0f766e)] p-5 text-white lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-medium text-emerald-50">Overall Maskan completion</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold">{formatPercent(data.totals.completionPercentage)}</span>
              <span className="pb-2 text-sm text-emerald-50">{formatJuzCount(completedJuz)}/{formatJuzCount(possibleJuz)} Juz completed</span>
            </div>
            <div className="mt-5 max-w-2xl">
              <Progress value={data.totals.completionPercentage} className="bg-emerald-950/40 [&>div]:bg-gold" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <HeroMini label="Active rooms" value={data.totals.activeRooms} />
              <HeroMini label="Floors" value={data.totals.floors} />
              <HeroMini label="Weekly Rub" value={weeklyCompleted} />
            </div>
          </div>
          <div className="rounded-lg bg-white/12 p-4 backdrop-blur">
            <p className="text-sm text-emerald-50">Leading floor</p>
            <p className="mt-2 text-2xl font-bold">{floorLeader?.floorName ?? "No floors yet"}</p>
            <p className="mt-1 text-sm text-emerald-50">{floorLeader ? `${formatPercent(floorLeader.completionPercentage)} complete across ${floorLeader.rooms} rooms` : "Create floors to start analytics."}</p>
            <div className="mt-5 grid gap-2">
              {roomsBehind.slice(0, 3).map((room) => (
                <div key={room.roomId} className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
                  <span>{room.roomName}</span>
                  <span>{room.weeklyCompleted}/{room.weeklyTarget}</span>
                </div>
              ))}
              {!roomsBehind.length ? <div className="rounded-md bg-white/10 px-3 py-2 text-sm">No rooms behind weekly target.</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat label="Overall" value={formatPercent(data.totals.completionPercentage)} helper="Maskan target" icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <AdminStat label="Rooms" value={data.totals.rooms} helper={`${data.totals.activeRooms} active`} icon={<DoorOpen className="h-5 w-5" />} />
        <AdminStat label="Floors" value={data.totals.floors} helper="Managed groups" icon={<Building2 className="h-5 w-5" />} />
        <AdminStat label="Behind" value={data.totals.roomsBehindTarget} helper="Weekly follow-up" icon={<TrendingDown className="h-5 w-5" />} tone={data.totals.roomsBehindTarget ? "warning" : "success"} />
        <AdminStat label="Activity" value={activity.data?.total ?? 0} helper="Recent events" icon={<Activity className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Weekly Trend</CardTitle>
            <StatusBadge tone="neutral">{weeklyCompleted} completed</StatusBadge>
          </div>
          <div className="mt-4 h-72">
            {data.weeklyTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e1cf" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#047857" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="undone" stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No weekly activity" />
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Rooms Behind Target</CardTitle>
          <div className="mt-4 grid gap-3">
            {roomsBehind.length ? (
              roomsBehind.slice(0, 6).map((room) => (
                <div key={room.roomId} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{room.roomName}</p>
                      <p className="text-xs text-muted-foreground">{room.floorName ?? "No floor"}</p>
                    </div>
                    <StatusBadge tone="warning">{room.weeklyCompleted}/{room.weeklyTarget}</StatusBadge>
                  </div>
                  <div className="mt-3">
                    <Progress value={room.completionPercentage} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No follow-up needed" />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_260px] sm:items-center">
          <CardTitle>Room Analytics</CardTitle>
          <Select value={selectedRoomId} onChange={(event) => setSelectedRoomId(event.target.value)}>
            {rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
          </Select>
        </div>
        {selectedRoom ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{selectedRoom.roomName}</span>
                <span className="text-muted-foreground">{formatPercent(selectedRoom.completionPercentage)}</span>
              </div>
              <Progress value={selectedRoom.completionPercentage} />
              <p className="mt-2 text-xs text-muted-foreground">{selectedRoom.completedRub}/{selectedRoom.yearlyTarget} Rub' overall</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Weekly target</span>
                <span className="text-muted-foreground">{selectedRoom.weeklyCompleted}/{selectedRoom.weeklyTarget}</span>
              </div>
              <Progress value={weeklyPercentage} />
              <p className="mt-2 text-xs text-muted-foreground">{selectedRoom.floorName ?? "No floor assigned"}</p>
            </div>
          </div>
        ) : selectedRoomId && roomAnalytics.isLoading ? (
          <div className="mt-4">
            <LoadingState />
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="No room data" />
          </div>
        )}
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>Floor Performance</CardTitle>
          <div className="mt-4 grid gap-3">
            {data.floorPerformance.length ? (
              data.floorPerformance.map((floor) => (
                <div key={floor.floorId} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span className="font-semibold">{floor.floorName}</span>
                    <span>{formatPercent(floor.completionPercentage)}</span>
                  </div>
                  <Progress value={floor.completionPercentage} />
                  <p className="mt-2 text-xs text-muted-foreground">{floor.rooms} rooms · {floor.completedRub}/{floor.targetRub} Rub'</p>
                </div>
              ))
            ) : (
              <EmptyState title="No floors yet" />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Top Rooms</CardTitle>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 h-72">
            {topRooms.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRooms}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e1cf" />
                  <XAxis dataKey="roomName" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completedRub" fill="#047857" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No room data" />
            )}
          </div>
        </Card>
      </section>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <div className="divide-y divide-border">
          {activity.isLoading ? (
            <div className="p-4">
              <LoadingState />
            </div>
          ) : activity.data?.items.length ? (
            activity.data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{formatActivityTitle(item.action, item.details)}</p>
                  <p className="text-xs text-muted-foreground">{item.actor_label}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No activity yet" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function HeroMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/12 p-3 backdrop-blur">
      <p className="text-xs text-emerald-50">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-56 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-[min(100%,32rem)] animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-full bg-muted sm:mb-1" />
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-soft">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#064e3b,#047857_56%,#0f766e)] p-5 text-white lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            <div className="h-4 w-44 animate-pulse rounded-full bg-white/20" />
            <div className="flex flex-wrap items-end gap-3">
              <div className="h-14 w-40 animate-pulse rounded-full bg-white/20" />
              <div className="h-4 w-56 animate-pulse rounded-full bg-white/20" />
            </div>
            <div className="h-3 w-full max-w-2xl animate-pulse rounded-full bg-white/20" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-20 animate-pulse rounded-lg bg-white/15" />
              <div className="h-20 animate-pulse rounded-lg bg-white/15" />
              <div className="h-20 animate-pulse rounded-lg bg-white/15" />
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/20" />
            <div className="mt-3 h-7 w-40 animate-pulse rounded-full bg-white/20" />
            <div className="mt-3 h-4 w-52 animate-pulse rounded-full bg-white/20" />
            <div className="mt-5 grid gap-2">
              <div className="h-10 animate-pulse rounded-md bg-white/15" />
              <div className="h-10 animate-pulse rounded-md bg-white/15" />
              <div className="h-10 animate-pulse rounded-md bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SkeletonPanel className="h-80" />
        <SkeletonPanel className="h-80" />
      </div>

      <SkeletonPanel className="h-72" />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SkeletonPanel className="h-80" />
        <SkeletonPanel className="h-80" />
      </div>

      <SkeletonPanel className="h-80" />
    </div>
  );
}

function SkeletonPanel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl border border-border bg-white shadow-soft", className)} />;
}

function SkeletonStat() {
  return <div className="h-28 animate-pulse rounded-lg border border-border bg-white shadow-soft" />;
}

function formatJuzCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
