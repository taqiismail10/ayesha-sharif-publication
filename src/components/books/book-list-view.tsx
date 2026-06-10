import { BookOpen } from "lucide-react";
import { bookStatusLabels } from "@/lib/constants";
import { getBooks } from "@/lib/data";
import { EmptyState } from "@/components/site/empty-state";
import { ProductCard } from "@/components/books/product-card";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/* ─── shared style strings ─── */
const filterLabelClass =
  "mb-1.5 block text-[12px] font-medium uppercase tracking-[0.08em]";

const filterSelectClass =
  "w-full rounded-[4px] px-3 py-2 text-[14px] outline-none transition-colors duration-150";

const filterSelectStyle = {
  border: "1px solid rgba(176,168,156,0.3)",
  color: "#2D4A2B",
  backgroundColor: "#FFFFFF",
  fontFamily: "var(--font-sans)",
} as const;

export async function BookListView({
  searchParams,
  title,
  description,
}: {
  searchParams: SearchParams;
  title: string;
  description: string;
}) {
  const q        = pick(searchParams.q);
  const category = pick(searchParams.category);
  const tag      = pick(searchParams.tag);
  const status   = pick(searchParams.status);
  const min      = pick(searchParams.min);
  const max      = pick(searchParams.max);
  const sort     = pick(searchParams.sort);

  const { books, categories, tags } = await getBooks({
    q, category, tag, status, min, max, sort,
  });

  /* Resolve display names for active filter pills */
  const activeCategoryName =
    category ? categories.find((c) => c.slug === category)?.name : null;
  const activeTagName =
    tag ? tags.find((t) => t.slug === tag)?.name : null;
  const activeStatusName =
    status ? bookStatusLabels[status as keyof typeof bookStatusLabels] : null;

  const hasActiveFilters = !!(activeCategoryName || activeTagName || activeStatusName || q || min || max);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-[32px] leading-[1.2]"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 400, color: "#2D4A2B" }}
        >
          {title}
        </h1>
        <p
          className="mt-2 text-[15px]"
          style={{ color: "#B0A89C", fontFamily: "var(--font-sans)" }}
        >
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── Desktop sidebar filter ── */}
        <aside
          className="hidden w-56 shrink-0 lg:block"
          style={{
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid rgba(176,168,156,0.2)",
          }}
        >
          <form className="flex flex-col gap-5 p-6">
            {/* Search */}
            <div>
              <label htmlFor="sidebar-q" className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Search
              </label>
              <input
                id="sidebar-q"
                name="q"
                defaultValue={q}
                placeholder="Title, author, ISBN…"
                className={filterSelectClass}
                style={filterSelectStyle}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="sidebar-cat" className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Category
              </label>
              <select
                id="sidebar-cat"
                name="category"
                defaultValue={category || ""}
                className={filterSelectClass}
                style={filterSelectStyle}
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label htmlFor="sidebar-tag" className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Tag
              </label>
              <select
                id="sidebar-tag"
                name="tag"
                defaultValue={tag || ""}
                className={filterSelectClass}
                style={filterSelectStyle}
              >
                <option value="">All tags</option>
                {tags.map((item) => (
                  <option key={item.id} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="sidebar-status" className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Status
              </label>
              <select
                id="sidebar-status"
                name="status"
                defaultValue={status || ""}
                className={filterSelectClass}
                style={filterSelectStyle}
              >
                <option value="">All statuses</option>
                {(["published", "pre_order", "upcoming", "out_of_stock"] as const).map((s) => (
                  <option key={s} value={s}>{bookStatusLabels[s]}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <span className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Price (৳)
              </span>
              <div className="flex gap-2">
                <input
                  name="min"
                  defaultValue={min}
                  inputMode="numeric"
                  placeholder="Min"
                  className={filterSelectClass}
                  style={filterSelectStyle}
                />
                <input
                  name="max"
                  defaultValue={max}
                  inputMode="numeric"
                  placeholder="Max"
                  className={filterSelectClass}
                  style={filterSelectStyle}
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sidebar-sort" className={filterLabelClass} style={{ color: "#B0A89C" }}>
                Sort by
              </label>
              <select
                id="sidebar-sort"
                name="sort"
                defaultValue={sort || "newest"}
                className={filterSelectClass}
                style={filterSelectStyle}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: low → high</option>
                <option value="price-high">Price: high → low</option>
                <option value="best-selling">Best selling</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-[4px] py-2.5 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#2D4A2B]"
              style={{ backgroundColor: "#6B8E6F" }}
            >
              Apply filters
            </button>

            {hasActiveFilters && (
              <a
                href="?"
                className="block text-center text-[12px] transition-colors duration-150 hover:text-[#2D4A2B]"
                style={{ color: "#B0A89C" }}
              >
                Clear all
              </a>
            )}
          </form>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile compact filter + sort */}
          <form className="mb-6 flex flex-wrap gap-2 lg:hidden">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search…"
              className="h-9 flex-1 rounded-[4px] px-3 text-sm outline-none"
              style={filterSelectStyle}
            />
            <select
              name="category"
              defaultValue={category || ""}
              className="h-9 rounded-[4px] px-3 text-sm outline-none"
              style={filterSelectStyle}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>{item.name}</option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={sort || "newest"}
              className="h-9 rounded-[4px] px-3 text-sm outline-none"
              style={filterSelectStyle}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price ↑</option>
              <option value="price-high">Price ↓</option>
              <option value="best-selling">Best selling</option>
            </select>
            <button
              type="submit"
              className="h-9 rounded-[4px] px-4 text-sm font-medium text-white"
              style={{ backgroundColor: "#6B8E6F" }}
            >
              Go
            </button>
          </form>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[12px]" style={{ color: "#B0A89C" }}>
                Active filters:
              </span>
              {q && <ActivePill label={`"${q}"`} />}
              {activeCategoryName && <ActivePill label={activeCategoryName} />}
              {activeTagName && <ActivePill label={activeTagName} />}
              {activeStatusName && <ActivePill label={activeStatusName} />}
              {(min || max) && (
                <ActivePill label={`৳${min || "0"} – ${max ? "৳" + max : "any"}`} />
              )}
              <a
                href="?"
                className="text-[12px] transition-colors duration-150 hover:text-[#2D4A2B]"
                style={{ color: "#B0A89C" }}
              >
                Clear
              </a>
            </div>
          )}

          {/* Books grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {books.map((book) => (
                <ProductCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="এখানে কোনো বই নেই"
              description="Try a different category, search term, or price range."
              action={{ label: "Browse all books", href: "/books" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActivePill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-[3px] text-[12px] font-medium text-white"
      style={{ backgroundColor: "#6B8E6F" }}
    >
      {label}
    </span>
  );
}
