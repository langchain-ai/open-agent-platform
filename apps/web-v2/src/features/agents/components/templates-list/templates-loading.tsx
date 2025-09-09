import { Skeleton } from "@/components/ui/skeleton";

export function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={`graph-loading-${index}`}
          className="h-[82px] w-full"
        />
      ))}
    </div>
  );
}
