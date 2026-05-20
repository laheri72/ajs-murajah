import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, Building2, CheckCircle2, DoorOpen, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Card, CardTitle } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";
import { apiFetch } from "../../lib/api";
import { formatDateTime, formatPercent } from "../../lib/utils";
import type { AdminAnalytics } from "../../types/domain";

export function AdminDashboard() {
  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<AdminAnalytics>("/api/admin/analytics"),
  });

  if (analytics.isLoading) return <LoadingState label="Loading admin analytics..." />;
  if (analytics.isError || !analytics.data) return <EmptyState title="Analytics unavailable" description="Check your Supabase connection and try again." />;

  const data = analytics.data;
  const weeklyCompleted = data.weeklyTrend.reduce((sum, item) => sum + item.completed, 0);
  const roomsBehind = data.roomPerformance.filter((room) => room.behindTarget);
  const topRooms = data.roomPerformance.slice(0, 8);
  const floorLeader = [...data.floorPerformance].sort((a, b) => b.completionPercentage - a.completionPercentage)[0];

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
              <span className="pb-2 text-sm text-emerald-50">{data.totals.completedRub}/{data.totals.possibleRub} Rub' completed</span>
            </div>
            <div className="mt-5 max-w-2xl">
              <Progress value={data.totals.completionPercentage} className="bg-emerald-950/40 [&>div]:bg-gold" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <HeroMini label="Active rooms" value={data.totals.activeRooms} />
              <HeroMini label="Floors" value={data.totals.floors} />
              <HeroMini label="Weekly logs" value={weeklyCompleted} />
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
        <AdminStat label="Activity" value={data.activity.length} helper="Recent events" icon={<Activity className="h-5 w-5" />} />
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
              <EmptyState title="No weekly activity" description="Room updates will form the trend line." />
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
              <EmptyState title="No follow-up needed" description="Every active room is at or above the weekly target." />
            )}
          </div>
        </Card>
      </section>

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
              <EmptyState title="No floors yet" description="Create floors to see floor performance." />
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
              <EmptyState title="No room data" description="Add rooms and progress to see rankings." />
            )}
          </div>
        </Card>
      </section>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <div className="divide-y divide-border">
          {data.activity.length ? (
            data.activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{item.actor_label}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No activity yet" description="Admin and room actions will appear here." />
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
