import { SkeletonBookGrid } from "@/components/books/skeleton-card";

export default function BooksLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Page header placeholder */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="shimmer h-8 w-48 rounded-sm" />
        <div className="shimmer h-4 w-80 rounded-sm" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar placeholder */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="flex flex-col gap-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="shimmer h-3 w-16 rounded-sm" />
                <div className="shimmer h-9 w-full rounded-[4px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Grid placeholder */}
        <div className="flex-1">
          <SkeletonBookGrid count={4} />
        </div>
      </div>
    </div>
  );
}
