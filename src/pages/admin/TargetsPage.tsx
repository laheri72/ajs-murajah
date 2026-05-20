import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Target, TrendingUp } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import type { Room, Target as TargetType } from "../../types/domain";

export function TargetsPage() {
  const queryClient = useQueryClient();
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => apiFetch<Room[]>("/api/admin/rooms") });
  const targets = useQuery({ queryKey: ["targets"], queryFn: () => apiFetch<(TargetType & { room: Room })[]>("/api/admin/targets") });
  const [form, setForm] = useState({ room_id: "", yearly_rub_target: 120, weekly_rub_target: 3, monthly_rub_target: 12 });
  const [globalForm, setGlobalForm] = useState({ yearly_rub_target: 120, weekly_rub_target: 3, monthly_rub_target: 12 });

  const selectedRoom = rooms.data?.find((room) => room.id === form.room_id);
  const targetCoverage = useMemo(() => {
    const roomCount = rooms.data?.length ?? 0;
    if (!roomCount) return 0;
    return Math.round(((targets.data?.length ?? 0) / roomCount) * 100);
  }, [rooms.data?.length, targets.data?.length]);

  const save = useMutation({
    mutationFn: () => apiFetch<TargetType>("/api/admin/targets", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  const saveGlobal = useMutation({
    mutationFn: () => apiFetch<TargetType[]>("/api/admin/targets", { method: "POST", body: JSON.stringify({ ...globalForm, apply_to_all: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  function onGlobalSubmit(event: FormEvent) {
    event.preventDefault();
    saveGlobal.mutate();
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Targets" description="Set weekly, monthly, and yearly Rub' expectations for rooms." />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Target coverage" value={`${targetCoverage}%`} helper={`${targets.data?.length ?? 0}/${rooms.data?.length ?? 0} rooms`} icon={<Target className="h-5 w-5" />} tone="success" />
        <AdminStat label="Default weekly" value="3" helper="Rub' per room" icon={<CalendarDays className="h-5 w-5" />} />
        <AdminStat label="Default yearly" value="120" helper="Full Quran target" icon={<TrendingUp className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="grid gap-4">
          <Card>
            <CardTitle>Set Global Room Target</CardTitle>
            <form className="mt-4 grid gap-4" onSubmit={onGlobalSubmit}>
              <TargetFields form={globalForm} onChange={setGlobalForm} />
              {saveGlobal.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{saveGlobal.error.message}</p> : null}
              {saveGlobal.isSuccess ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Global target updated for active rooms.</p> : null}
              <Button disabled={!rooms.data?.length || saveGlobal.isPending}>{saveGlobal.isPending ? "Saving..." : "Apply to all active rooms"}</Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Set Room Target</CardTitle>
            <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
              <div>
                <Label>Room</Label>
                <Select value={form.room_id} onChange={(event) => setForm({ ...form, room_id: event.target.value })}>
                  <option value="">Select room</option>
                  {rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </Select>
                {selectedRoom ? <p className="mt-2 text-xs text-muted-foreground">{selectedRoom.floor?.name ?? "No floor"} - {selectedRoom.member_count} members</p> : null}
              </div>
              <TargetFields form={form} onChange={(nextForm) => setForm({ ...form, ...nextForm })} />
              {save.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{save.error.message}</p> : null}
              <Button disabled={!form.room_id || save.isPending}>{save.isPending ? "Saving..." : "Save target"}</Button>
            </form>
          </Card>
        </div>

        <Card className="p-0">
          <div className="border-b border-border p-4">
            <CardTitle>Current Targets</CardTitle>
          </div>
          <div className="divide-y divide-border">
            {targets.isLoading ? (
              <div className="p-4">
                <LoadingState />
              </div>
            ) : targets.data?.length ? (
              targets.data.map((target) => (
                <div key={target.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{target.room.name}</p>
                      <StatusBadge tone="success">Configured</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">@{target.room.username}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <TargetMetric label="Year" value={target.yearly_rub_target} />
                    <TargetMetric label="Week" value={target.weekly_rub_target} />
                    <TargetMetric label="Month" value={target.monthly_rub_target ?? 0} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4">
                <EmptyState title="No targets yet" />
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

type TargetForm = { yearly_rub_target: number; weekly_rub_target: number; monthly_rub_target: number };

function TargetFields({ form, onChange }: { form: TargetForm; onChange: (form: TargetForm) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
      <div>
        <Label>Yearly Rub'</Label>
        <Input type="number" min={1} max={120} value={form.yearly_rub_target} onChange={(event) => onChange({ ...form, yearly_rub_target: Number(event.target.value) })} />
      </div>
      <div>
        <Label>Weekly Rub'</Label>
        <Input type="number" min={0} max={120} value={form.weekly_rub_target} onChange={(event) => onChange({ ...form, weekly_rub_target: Number(event.target.value) })} />
      </div>
      <div>
        <Label>Monthly Rub'</Label>
        <Input type="number" min={0} max={120} value={form.monthly_rub_target} onChange={(event) => onChange({ ...form, monthly_rub_target: Number(event.target.value) })} />
      </div>
    </div>
  );
}

function TargetMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
