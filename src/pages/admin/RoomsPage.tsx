import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Search, ShieldCheck, Users } from "lucide-react";
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
import type { Floor, Room } from "../../types/domain";

const initialRoom = { name: "", username: "", password: "", member_count: 1, floor_id: "" };

export function RoomsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialRoom);
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => apiFetch<Room[]>("/api/admin/rooms") });
  const floors = useQuery({ queryKey: ["floors"], queryFn: () => apiFetch<Floor[]>("/api/admin/floors") });

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rooms.data ?? []).filter((room) => {
      const matchesSearch = !term || room.name.toLowerCase().includes(term) || room.username.toLowerCase().includes(term) || room.floor?.name.toLowerCase().includes(term);
      const matchesFloor = floorFilter === "all" || room.floor_id === floorFilter;
      return matchesSearch && matchesFloor;
    });
  }, [floorFilter, rooms.data, search]);

  const activeRooms = (rooms.data ?? []).filter((room) => room.is_active).length;
  const totalMembers = (rooms.data ?? []).reduce((sum, room) => sum + room.member_count, 0);

  const save = useMutation({
    mutationFn: () => apiFetch<Room>("/api/admin/rooms", { method: "POST", body: JSON.stringify({ ...form, name: form.name.trim(), username: form.username.trim(), floor_id: form.floor_id || null, is_active: true }) }),
    onSuccess: () => {
      setForm(initialRoom);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-room-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Rooms" description="Manage room identities, member counts, shared credentials, and floor assignments." />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStat label="Rooms" value={rooms.data?.length ?? 0} helper={`${activeRooms} active`} icon={<DoorOpen className="h-5 w-5" />} />
        <AdminStat label="Members" value={totalMembers} helper="Across all rooms" icon={<Users className="h-5 w-5" />} />
        <AdminStat label="Credentials" value="Shared" helper="Room username/password" icon={<ShieldCheck className="h-5 w-5" />} tone="success" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardTitle>Add Room</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <Label>Room name</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>
              <div>
                <Label>Members</Label>
                <Input type="number" min={1} value={form.member_count} onChange={(event) => setForm({ ...form, member_count: Number(event.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Floor</Label>
              <Select value={form.floor_id} onChange={(event) => setForm({ ...form, floor_id: event.target.value })}>
                <option value="">No floor</option>
                {floors.data?.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
              </Select>
            </div>
            {save.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{save.error.message}</p> : null}
            <Button disabled={!form.name.trim() || !form.username.trim() || !form.password || save.isPending}>{save.isPending ? "Saving..." : "Create room"}</Button>
          </form>
        </Card>

        <Card className="p-0">
          <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1fr_220px]">
            <div>
              <CardTitle>Room Directory</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{filteredRooms.length} rooms shown</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" aria-label="Search rooms" />
              </div>
              <Select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
                <option value="all">All floors</option>
                {floors.data?.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="divide-y divide-border">
            {rooms.isLoading ? (
              <div className="p-4">
                <LoadingState />
              </div>
            ) : filteredRooms.length ? (
              filteredRooms.map((room) => (
                <div key={room.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{room.name}</p>
                      <StatusBadge tone={room.is_active ? "success" : "neutral"}>{room.is_active ? "Active" : "Inactive"}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{room.floor?.name ?? "No floor"} · {room.member_count} members · @{room.username}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:flex">
                    <div className="rounded-md bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="font-semibold">{room.member_count}</p>
                    </div>
                    <div className="rounded-md bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground">Floor</p>
                      <p className="font-semibold">{room.floor?.name ?? "None"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4">
                <EmptyState title="No rooms found" />
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
