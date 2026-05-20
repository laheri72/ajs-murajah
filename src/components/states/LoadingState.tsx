export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-label={label}>
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
