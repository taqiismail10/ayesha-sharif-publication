import { SkeletonBookGrid } from "@/components/books/skeleton-card";

export default function SearchLoading() {
  return (
    <>
      {/* Search bar placeholder */}
      <div
        className="border-b py-10"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(176, 168, 156, 0.2)",
        }}
      >
        <div className="mx-auto max-w-[560px] px-6">
          <div className="shimmer h-[52px] w-full rounded-[6px]" />
        </div>
      </div>

      {/* Results placeholder */}
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-6 flex flex-col gap-2">
          <div className="shimmer h-7 w-44 rounded-sm" />
          <div className="shimmer h-4 w-72 rounded-sm" />
        </div>
        <SkeletonBookGrid count={4} />
      </div>
    </>
  );
}
