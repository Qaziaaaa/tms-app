import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[280px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[240px]" />
        <Skeleton className="h-[240px]" />
      </div>
    </div>
  );
}
