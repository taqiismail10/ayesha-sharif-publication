import { SkeletonText, SkeletonCircle } from "@/components/books/skeleton-card";

export default function OrderDetailLoading() {
  return (
    <div className="container-px mx-auto max-w-4xl py-10" aria-busy="true" aria-live="polite">
      {/* Header: back link + order number + status badge */}
      <div className="shimmer h-4 w-24 rounded-sm" aria-hidden="true" />
      <div className="mt-4 flex items-center justify-between gap-4">
        <SkeletonText className="h-8 w-56" />
        <SkeletonText className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-2">
        <SkeletonText className="h-4 w-40" />
      </div>

      {/* Summary card */}
      <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-sm">
        <SkeletonText className="h-5 w-32" />
        <div className="mt-4 grid gap-3">
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-3/4" />
          <SkeletonText className="h-4 w-2/3" />
        </div>
      </section>

      {/* Line items */}
      <section className="mt-6 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-lg border border-line bg-white p-4 shadow-sm"
          >
            <SkeletonCircle className="h-14 w-14" />
            <div className="flex flex-col gap-2">
              <SkeletonText className="h-4 w-2/3" />
              <SkeletonText className="h-3 w-1/3" />
            </div>
            <SkeletonText className="h-4 w-20" />
          </div>
        ))}
      </section>

      {/* Totals */}
      <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-3/4" />
          <SkeletonText className="h-4 w-2/3" />
          <div className="mt-2 border-t border-line pt-3">
            <SkeletonText className="h-5 w-1/2" />
          </div>
        </div>
      </section>
    </div>
  );
}