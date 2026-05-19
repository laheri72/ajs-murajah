import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import type { Floor, Room } from "../../types/domain";

const initialRoom = { name: "", username: "", password: "", member_count: 1, floor_id: "" };

export function RoomsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialRoom);
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => apiFetch<Room[]>("/api/admin/rooms") });
  const floors = useQuery({ queryKey: ["floors"], queryFn: () => apiFetch<Floor[]>("/api/admin/floors") });
  const save = useMutation({
    mutationFn: () => apiFetch<Room>("/api/admin/rooms", { method: "POST", body: JSON.stringify({ ...form, floor_id: form.floor_id || null, is_active: true }) }),
    onSuccess: () => {
      setForm(initialRoom);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Rooms</h1>
      <Card>
        <CardTitle>Add Room</CardTitle>
        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit}>
          <div><Label>Room name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div><Label>Username</Label><Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
          <div><Label>Members</Label><Input type="number" value={form.member_count} onChange={(event) => setForm({ ...form, member_count: Number(event.target.value) })} /></div>
          <div>
            <Label>Floor</Label>
            <Select value={form.floor_id} onChange={(event) => setForm({ ...form, floor_id: event.target.value })}>
              <option value="">No floor</option>
              {floors.data?.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
            </Select>
          </div>
          <Button className="self-end" disabled={!form.name || !form.username || !form.password || save.isPending}>Save Room</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>All Rooms</CardTitle>
        <div className="mt-4 grid gap-3">
          {rooms.isLoading ? <LoadingState /> : rooms.data?.length ? rooms.data.map((room) => (
            <div key={room.id} className="grid gap-1 rounded-md border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">{room.name}</p>
                <p className="text-sm text-muted-foreground">{room.floor?.name ?? "No floor"} · {room.member_count} members · @{room.username}</p>
              </div>
              <span className="text-sm text-muted-foreground">{room.is_active ? "Active" : "Inactive"}</span>
            </div>
          )) : <EmptyState title="No rooms yet" description="Create room credentials for room heads." />}
        </div>
      </Card>
    </div>
  );
}
