import { useQuery } from "@tanstack/react-query";
import { Activity, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import { formatActivityTitle, formatDateTime } from "../../lib/utils";
import type { PaginatedActivityResponse } from "../../types/domain";

export function ActivityPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const activity = useQuery({
    queryKey: ["admin-activity", page, pageSize, role, search],
    queryFn: () => apiFetch<PaginatedActivityResponse>(`/api/admin/activity?page=${page}&limit=${pageSize}&role=${role}&q=${encodeURIComponent(search.trim())}`),
  });

  useEffect(() => {
    setPage(1);
  }, [role, search]);

  const filteredActivity = useMemo(() => {
    return activity.data?.items ?? [];
  }, [activity.data]);

  const roomEvents = filteredActivity.filter((item) => item.actor_role === "room").length;
  const adminEvents = filteredActivity.filter((item) => item.actor_role === "admin").length;
  const totalPages = Math.max(1, Math.ceil((activity.data?.total ?? 0) / pageSize));

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Activity" description="Audit recent admin changes and summarized room progress sessions." />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Events" value={activity.data?.total ?? 0} helper="Latest audit entries" icon={<Activity className="h-5 w-5" />} />
        <AdminStat label="Room events" value={roomEvents} helper="Progress activity" />
        <AdminStat label="Admin events" value={adminEvents} helper="Configuration activity" />
      </section>

      <Card className="p-0">
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1fr_240px_180px] lg:items-end">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{filteredActivity.length} events on this page</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" aria-label="Search activity" />
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
                    <p className="font-semibold">{formatActivityTitle(item.action, item.details)}</p>
                    <StatusBadge tone={item.actor_role === "admin" ? "warning" : "success"}>{item.actor_role}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.actor_label}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No activity found" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="rounded-md border border-border px-3 py-2 disabled:opacity-50" disabled={page <= 1 || activity.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <button className="rounded-md border border-border px-3 py-2 disabled:opacity-50" disabled={page >= totalPages || activity.isLoading} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
