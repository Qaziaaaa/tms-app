import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPasswordLoading() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 max-w-md" />
    </div>
  );
}
