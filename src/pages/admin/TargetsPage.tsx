import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import type { Room, Target } from "../../types/domain";

export function TargetsPage() {
  const queryClient = useQueryClient();
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => apiFetch<Room[]>("/api/admin/rooms") });
  const targets = useQuery({ queryKey: ["targets"], queryFn: () => apiFetch<(Target & { room: Room })[]>("/api/admin/targets") });
  const [form, setForm] = useState({ room_id: "", yearly_rub_target: 120, weekly_rub_target: 3, monthly_rub_target: 12 });
  const save = useMutation({
    mutationFn: () => apiFetch<Target>("/api/admin/targets", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Targets</h1>
      <Card>
        <CardTitle>Set Room Target</CardTitle>
        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
          <div>
            <Label>Room</Label>
            <Select value={form.room_id} onChange={(event) => setForm({ ...form, room_id: event.target.value })}>
              <option value="">Select room</option>
              {rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </Select>
          </div>
          <div><Label>Yearly Rub’</Label><Input type="number" value={form.yearly_rub_target} onChange={(event) => setForm({ ...form, yearly_rub_target: Number(event.target.value) })} /></div>
          <div><Label>Weekly Rub’</Label><Input type="number" value={form.weekly_rub_target} onChange={(event) => setForm({ ...form, weekly_rub_target: Number(event.target.value) })} /></div>
          <div><Label>Monthly Rub’</Label><Input type="number" value={form.monthly_rub_target} onChange={(event) => setForm({ ...form, monthly_rub_target: Number(event.target.value) })} /></div>
          <Button className="xl:col-span-4" disabled={!form.room_id || save.isPending}>Save Target</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Current Targets</CardTitle>
        <div className="mt-4 grid gap-3">
          {targets.isLoading ? <LoadingState /> : targets.data?.length ? targets.data.map((target) => (
            <div key={target.id} className="grid gap-1 rounded-md border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <span className="font-medium">{target.room.name}</span>
              <span className="text-sm text-muted-foreground">Year {target.yearly_rub_target} · Week {target.weekly_rub_target} · Month {target.monthly_rub_target ?? 0}</span>
            </div>
          )) : <EmptyState title="No targets yet" description="Assign a target to each room." />}
        </div>
      </Card>
    </div>
  );
}
