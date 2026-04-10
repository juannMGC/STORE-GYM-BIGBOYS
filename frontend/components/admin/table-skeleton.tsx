export function AdminTableSkeleton() {
  return (
    <div className="panel-brand divide-y divide-brand-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex animate-pulse gap-4 p-4">
          <div className="h-4 flex-1 rounded bg-brand-border" />
          <div className="h-4 w-24 rounded bg-brand-border" />
          <div className="h-8 w-28 rounded bg-brand-border" />
        </div>
      ))}
    </div>
  );
}
