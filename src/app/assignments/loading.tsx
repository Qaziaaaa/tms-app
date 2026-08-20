import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentsLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[500px] lg:col-span-2" />
      </div>
    </div>
  );
}
