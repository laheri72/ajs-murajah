import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, CheckCircle2, DoorOpen, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../../components/dashboard/MetricCard";
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

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Maskan progress overview and room status.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Overall" value={formatPercent(data.totals.completionPercentage)} helper={`${data.totals.completedRub}/${data.totals.possibleRub} Rub’`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <MetricCard label="Rooms" value={data.totals.rooms} helper={`${data.totals.activeRooms} active`} icon={<DoorOpen className="h-5 w-5" />} />
        <MetricCard label="Floors" value={data.totals.floors} icon={<Building2 className="h-5 w-5" />} />
        <MetricCard label="Behind target" value={data.totals.roomsBehindTarget} helper="Need follow-up" icon={<TrendingDown className="h-5 w-5" />} />
        <MetricCard label="Weekly logs" value={data.weeklyTrend.reduce((sum, item) => sum + item.completed, 0)} helper="Completed this week" icon={<BarChart3 className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Floor Performance</CardTitle>
          <div className="mt-4 grid gap-3">
            {data.floorPerformance.map((floor) => (
              <div key={floor.floorId} className="rounded-md border border-border p-3">
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-medium">{floor.floorName}</span>
                  <span>{formatPercent(floor.completionPercentage)}</span>
                </div>
                <Progress value={floor.completionPercentage} />
                <p className="mt-2 text-xs text-muted-foreground">{floor.rooms} rooms · {floor.completedRub}/{floor.targetRub} Rub’</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <div className="mt-4 grid gap-3">
            {data.activity.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{item.actor_label} {item.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Room Rankings</CardTitle>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.roomPerformance.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="roomName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completedRub" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
