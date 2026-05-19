export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="grid gap-3">
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
