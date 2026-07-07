/**
 * Skeleton placeholders shown while book/order/account data is loading.
 *
 * Primitives (SkeletonText, SkeletonCircle, SkeletonBlock, SkeletonRow) compose
 * from the global `.shimmer` utility (sweep gradient animation defined in
 * globals.css). Higher-level components (SkeletonCard, SkeletonBookGrid) match
 * the real ProductCard layout to avoid content shift on hydration.
 */
type SkeletonBoxProps = {
  className?: string;
  /** Override the outer wrapper className */
  wrapperClassName?: string;
};

/** Single line of skeleton text. Defaults to ~body length. */
export function SkeletonText({
  className = "h-4 w-full",
  wrapperClassName,
}: SkeletonBoxProps) {
  return (
    <div
      className={`shimmer rounded-sm ${className} ${wrapperClassName ?? ""}`.trim()}
      aria-hidden="true"
    />
  );
}

/** Circular skeleton — avatars, icons, badges. */
export function SkeletonCircle({
  className = "h-10 w-10",
}: SkeletonBoxProps) {
  return (
    <div
      className={`shimmer rounded-full ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

/** Generic block — covers, buttons, panels. */
export function SkeletonBlock({
  className = "w-full",
}: SkeletonBoxProps) {
  return (
    <div
      className={`shimmer rounded-[6px] ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

/** Single horizontal row skeleton: circle + 2 stacked text lines. */
export function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 rounded-[6px] border border-[rgba(176,168,156,0.2)] bg-white px-4 py-3"
      aria-hidden="true"
    >
      <SkeletonCircle className="h-12 w-12 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonText className="h-4 w-2/5" />
        <SkeletonText className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="h-6 w-16" />
    </div>
  );
}

/**
 * Skeleton card shown while book data is loading.
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

/** Four skeleton cards in the catalogue/search grid layout */
export function SkeletonBookGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
