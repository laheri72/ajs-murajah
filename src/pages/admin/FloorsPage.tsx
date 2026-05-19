import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/dashboard/AdminPageHeader";
import { AdminStat } from "../../components/dashboard/AdminStat";
import { EmptyState } from "../../components/states/EmptyState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle } from "../../components/ui/Card";
import { Input, Label } from "../../components/ui/Input";
import { apiFetch } from "../../lib/api";
import type { Floor } from "../../types/domain";

export function FloorsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const floors = useQuery({ queryKey: ["floors"], queryFn: () => apiFetch<Floor[]>("/api/admin/floors") });
  const sortedFloors = useMemo(() => [...(floors.data ?? [])].sort((a, b) => a.sort_order - b.sort_order), [floors.data]);

  const save = useMutation({
    mutationFn: () => apiFetch<Floor>("/api/admin/floors", { method: "POST", body: JSON.stringify({ name: name.trim(), sort_order: sortOrder }) }),
    onSuccess: () => {
      setName("");
      setSortOrder(0);
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Floors" description="Create and order hostel floors so room progress can be grouped cleanly." />

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <CardTitle>Add Floor</CardTitle>
            <div className="rounded-md bg-gold-soft p-2 text-primary">
              <Plus className="h-5 w-5" />
            </div>
          </div>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Floor 1" />
            </div>
            <div>
              <Label>Display order</Label>
              <Input type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
            </div>
            {save.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{save.error.message}</p> : null}
            <Button disabled={!name.trim() || save.isPending}>{save.isPending ? "Saving..." : "Create floor"}</Button>
          </form>
        </Card>

        <div className="grid gap-4">
          <section className="grid gap-3 sm:grid-cols-2">
            <AdminStat label="Total floors" value={sortedFloors.length} helper="Active floor groups" icon={<Building2 className="h-5 w-5" />} />
            <AdminStat label="Next order" value={sortedFloors.length ? Math.max(...sortedFloors.map((floor) => floor.sort_order)) + 1 : 0} helper="Suggested display order" />
          </section>

          <Card className="p-0">
            <div className="border-b border-border p-4">
              <CardTitle>Floor Directory</CardTitle>
            </div>
            <div className="divide-y divide-border">
              {floors.isLoading ? (
                <div className="p-4">
                  <LoadingState />
                </div>
              ) : sortedFloors.length ? (
                sortedFloors.map((floor, index) => (
                  <div key={floor.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted font-semibold text-primary">{index + 1}</div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{floor.name}</p>
                        <p className="text-sm text-muted-foreground">Sort order {floor.sort_order}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4">
                  <EmptyState title="No floors yet" description="Create the first Maskan floor." />
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
