import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
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
  const save = useMutation({
    mutationFn: () => apiFetch<Floor>("/api/admin/floors", { method: "POST", body: JSON.stringify({ name, sort_order: sortOrder }) }),
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
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Floors</h1>
      <Card>
        <CardTitle>Add Floor</CardTitle>
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]" onSubmit={onSubmit}>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Floor 1" />
          </div>
          <div>
            <Label>Order</Label>
            <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
          </div>
          <Button className="self-end" disabled={!name || save.isPending}>Save</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>All Floors</CardTitle>
        <div className="mt-4 grid gap-2">
          {floors.isLoading ? <LoadingState /> : floors.data?.length ? floors.data.map((floor) => (
            <div key={floor.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="font-medium">{floor.name}</span>
              <span className="text-sm text-muted-foreground">Order {floor.sort_order}</span>
            </div>
          )) : <EmptyState title="No floors yet" description="Create the first Maskan floor." />}
        </div>
      </Card>
    </div>
  );
}
