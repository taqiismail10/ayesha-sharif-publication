import { SkeletonRow } from "@/components/books/skeleton-card";

export default function OrdersLoading() {
  return (
    <div className="container-px mx-auto max-w-4xl py-10" aria-busy="true" aria-live="polite">
      <div className="shimmer h-9 w-44 rounded-md" aria-hidden="true" />
      <div className="shimmer mt-3 h-4 w-72 max-w-full rounded-sm" aria-hidden="true" />

      <div className="mt-8 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}