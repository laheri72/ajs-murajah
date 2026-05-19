import { useQuery } from "@tanstack/react-query";
import { Activity, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import type { ActivityLog } from "../../types/domain";

export function ActivityPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => apiFetch<ActivityLog[]>("/api/admin/activity") });

  const filteredActivity = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (activity.data ?? []).filter((item) => {
      const matchesRole = role === "all" || item.actor_role === role;
      const matchesSearch = !term || item.actor_label.toLowerCase().includes(term) || item.action.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [activity.data, role, search]);

  const roomEvents = (activity.data ?? []).filter((item) => item.actor_role === "room").length;
  const adminEvents = (activity.data ?? []).filter((item) => item.actor_role === "admin").length;

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Activity" description="Audit recent admin changes, room updates, completions, and undo actions." />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Events" value={activity.data?.length ?? 0} helper="Latest audit entries" icon={<Activity className="h-5 w-5" />} />
        <AdminStat label="Room events" value={roomEvents} helper="Progress activity" />
        <AdminStat label="Admin events" value={adminEvents} helper="Configuration activity" />
      </section>

      <Card className="p-0">
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1fr_240px_180px] lg:items-end">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{filteredActivity.length} events shown</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" className="pl-9" />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Select value={role} onChange={(event) => setRole(event.target.value)} className="pl-9">
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="room">Room</option>
            </Select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {activity.isLoading ? (
            <div className="p-4">
              <LoadingState />
            </div>
          ) : filteredActivity.length ? (
            filteredActivity.map((item) => (
              <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.action.replaceAll("_", " ")}</p>
                    <StatusBadge tone={item.actor_role === "admin" ? "warning" : "success"}>{item.actor_role}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.actor_label}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No activity found" description="Adjust filters or wait for room progress updates." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
