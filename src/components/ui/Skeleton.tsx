import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse bg-bg-tertiary rounded-md', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="flex-1 bg-bg-card border border-border-base rounded-md p-5 px-6">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-10 w-16" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-bg-card border border-border-base rounded-md p-5 px-6', className)}>
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-48 mb-4" />
      <Skeleton className="h-[220px] w-full" />
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 bg-bg-card border border-border-base rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-20" />
      <div className="flex items-center justify-between mt-auto pt-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 px-4 bg-bg-card border border-border-base rounded-md">
      <div className="flex-1">
        <Skeleton className="h-3.5 w-40 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-14" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent',
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-bg-primary">
      <Spinner />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}
