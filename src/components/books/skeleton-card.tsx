/**
 * Skeleton placeholder card shown while book data is loading.
 * Matches ProductCard dimensions: aspect-ratio 3/4 cover + info block.
 */
export function SkeletonCard() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[8px] border border-[rgba(176,168,156,0.2)] bg-white"
      aria-hidden="true"
    >
      {/* Cover placeholder — 3/4 aspect ratio */}
      <div className="shimmer aspect-[3/4] w-full" />

      {/* Info placeholder */}
      <div className="flex flex-col gap-2 p-4">
        {/* Title lines */}
        <div className="shimmer h-4 w-3/4 rounded-sm" />
        <div className="shimmer h-4 w-1/2 rounded-sm" />
        {/* Author */}
        <div className="shimmer mt-1 h-3 w-2/5 rounded-sm" />
        {/* Price + button */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="shimmer h-4 w-16 rounded-sm" />
          <div className="shimmer h-4 w-12 rounded-sm" />
        </div>
        <div className="shimmer mt-2 h-8 w-full rounded-[4px]" />
      </div>
    </div>
  );
}

/** Four skeleton cards in the standard book grid layout */
export function SkeletonBookGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
