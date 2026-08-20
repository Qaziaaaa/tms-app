import { Skeleton } from "@/components/ui/skeleton";

export default function StudentGradesLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
